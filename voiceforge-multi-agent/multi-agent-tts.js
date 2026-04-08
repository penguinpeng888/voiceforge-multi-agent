/**
 * Multi-Agent TTS 系统
 * 
 * 并行调用多个海螺AI网页实例，生成音频后合并
 * 
 * 架构：
 * Input → 文本分片 → [Agent1][Agent2][Agent3][Agent4] 并行 → 音频合并 → Output
 */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class MultiAgentTTS {
  constructor(options = {}) {
    this.numAgents = options.numAgents || 4;  // 并行Agent数量
    this.concurrentLimit = options.concurrentLimit || 4;  // 并发限制
    this.tempDir = options.tempDir || './temp-tts';
    this.hailuoUrl = options.hailuoUrl || 'https://hailuoai.com/tts';
    
    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 文本分片
   * 把长文本分成多个小段落
   */
  splitText(text, numChunks) {
    // 按句子分割
    const sentences = text.split(/([。！？\n])/);
    const chunks = Array.from({ length: numChunks }, () => []);
    
    let currentChunk = 0;
    let currentLength = 0;
    const targetLength = Math.ceil(text.length / numChunks);
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      chunks[currentChunk].push(sentence);
      currentLength += sentence.length;
      
      // 如果当前块已经达到目标长度或到句末，换到下一个块
      if (currentLength >= targetLength || (i > 0 && ['。', '！', '？', '\n'].includes(sentence))) {
        currentChunk = (currentChunk + 1) % numChunks;
        if (currentChunk === 0) currentLength = 0;
      }
    }
    
    // 合并每个块
    return chunks.map(chunk => chunk.join('')).filter(t => t.trim().length > 0);
  }

  /**
   * 单个Agent处理 - 海螺AI网页版
   * 
   * 注意：需要用户先登录海螺AI账号
   * 首次运行时会打开浏览器让用户登录
   */
  async agentProcess(agentId, textSegments, outputDir) {
    console.log(`[Agent ${agentId}] 启动，处理 ${textSegments.length} 个片段`);
    
    const results = [];
    const browser = await chromium.launch({ 
      headless: false,  // 需要手动登录
      args: ['--no-sandbox']
    });
    
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // 访问海螺AI
      await page.goto(this.hailuoUrl);
      await page.waitForLoadState('networkidle');
      
      // 等待用户登录（首次）
      console.log(`[Agent ${agentId}] 请在浏览器中完成登录...`);
      
      for (let i = 0; i < textSegments.length; i++) {
        const segment = textSegments[i];
        const outputPath = path.join(outputDir, `segment_${agentId}_${i}.mp3`);
        
        console.log(`[Agent ${agentId}] 处理片段 ${i + 1}/${textSegments.length}`);
        
        try {
          // 清空输入框
          await page.fill('textarea', '');
          
          // 输入文本
          await page.fill('textarea', segment);
          
          // 点击生成按钮（需要根据实际页面调整选择器）
          const generateButton = await page.$('button:has-text("生成")');
          if (generateButton) {
            await generateButton.click();
          } else {
            // 尝试其他可能的按钮
            await page.click('button.primary, button[type="submit"]');
          }
          
          // 等待生成（5-15秒）
          await page.waitForTimeout(8000);
          
          // 下载音频（需要根据实际页面调整）
          // 这里需要检查页面是否有下载链接或自动播放
          // 暂时用占位
          results.push({ 
            success: true, 
            segment: i, 
            path: outputPath,
            text: segment 
          });
          
        } catch (err) {
          console.error(`[Agent ${agentId}] 片段 ${i} 失败:`, err.message);
          results.push({ 
            success: false, 
            segment: i, 
            error: err.message 
          });
        }
      }
      
    } finally {
      await browser.close();
    }
    
    return results;
  }

  /**
   * 并行处理多个Agent
   */
  async parallelProcess(text) {
    console.log(`开始多Agent TTS 处理，文本长度: ${text.length}`);
    
    // 1. 文本分片
    const segments = this.splitText(text, this.numAgents);
    console.log(`分片数量: ${segments.length}`);
    
    // 2. 为每个Agent分配任务
    const tasks = [];
    for (let i = 0; i < this.numAgents && i < segments.length; i++) {
      const agentSegments = segments.filter((_, idx) => idx % this.numAgents === i);
      if (agentSegments.length > 0) {
        tasks.push(this.agentProcess(i, agentSegments, this.tempDir));
      }
    }
    
    // 3. 并行执行
    console.log(`启动 ${tasks.length} 个并行Agent...`);
    const results = await Promise.all(tasks);
    
    // 4. 收集所有结果
    const allResults = results.flat();
    console.log(`完成 ${allResults.length} 个片段处理`);
    
    return allResults;
  }

  /**
   * 合并音频文件
   */
  async mergeAudioFiles(audioFiles, outputPath) {
    return new Promise((resolve, reject) => {
      // 创建文件列表
      const listFile = path.join(this.tempDir, 'concat.txt');
      const fileContent = audioFiles.map(f => `file '${f}'`).join('\n');
      fs.writeFileSync(listFile, fileContent);
      
      // 使用 ffmpeg 合并
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        outputPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`合并完成: ${outputPath}`);
          resolve(outputPath);
        } else {
          reject(new Error(`ffmpeg 合并失败，退出码: ${code}`));
        }
      });
      
      ffmpeg.on('error', reject);
    });
  }

  /**
   * 主处理流程
   */
  async synthesize(text, options = {}) {
    const outputPath = options.output || path.join(this.tempDir, 'output.mp3');
    
    try {
      // 并行处理
      const results = await this.parallelProcess(text);
      
      // 过滤成功的音频文件
      const successFiles = results
        .filter(r => r.success)
        .map(r => r.path)
        .filter(f => fs.existsSync(f));
      
      if (successFiles.length === 0) {
        throw new Error('没有成功生成的音频文件');
      }
      
      // 合并音频
      if (successFiles.length > 1) {
        await this.mergeAudioFiles(successFiles, outputPath);
      } else {
        // 只有一个文件，直接重命名
        fs.renameSync(successFiles[0], outputPath);
      }
      
      return {
        success: true,
        outputPath,
        segments: results.length,
        failed: results.filter(r => !r.success).length
      };
      
    } catch (error) {
      console.error('TTS 处理失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 清理临时文件
   */
  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
      console.log('临时文件已清理');
    }
  }
}

module.exports = { MultiAgentTTS };

// 测试
if (require.main === module) {
  const tts = new MultiAgentTTS({ numAgents: 2 });
  
  const testText = '这是一个测试文本。我们需要把它分成多个段落。让多个Agent并行处理。每个Agent处理一段文本。然后合并成完整的音频。';
  
  tts.synthesize(testText, { output: './test-output.mp3' })
    .then(result => console.log('结果:', result))
    .catch(err => console.error('错误:', err));
}