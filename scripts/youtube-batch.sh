#!/bin/bash
# =====================================================
# YouTube 批量下载转录工具
# 功能：批量下载视频 + 提取音频 + 语音转文字
# 使用方法：./youtube-batch.sh links.txt
# =====================================================

set -e  # 遇到错误立即退出

# 配置
COOKIES_FILE="youtube-cookies.txt"
OUTPUT_DIR="workspace/youtube-downloads"
MODEL_SIZE="medium"  # tiny, base, small, medium, large

# 检查参数
if [ $# -lt 1 ]; then
    echo "用法: $0 <链接列表文件> [输出目录]"
    echo "示例: $0 links.txt"
    echo "       $0 links.txt ./my-videos"
    exit 1
fi

LINKS_FILE="$1"
if [ ! -z "$2" ]; then
    OUTPUT_DIR="$2"
fi

# 创建输出目录
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

echo "========================================"
echo "🚀 YouTube 批量下载转录工具"
echo "========================================"
echo "📁 输出目录: $(pwd)"
echo "📄 链接文件: $LINKS_FILE"
echo "========================================"

# 检查依赖
if ! command -v yt-dlp &> /dev/null; then
    echo "❌ 错误: 未安装 yt-dlp"
    echo "安装: pip install yt-dlp"
    exit 1
fi

if ! command -v whisper &> /dev/null; then
    echo "❌ 错误: 未安装 whisper"
    echo "安装: pip install -U openai-whisper"
    echo "      或者: conda install -c conda-forge whisper"
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️ 警告: 未安装 ffmpeg，音频提取可能失败"
fi

# 检查 cookies 文件
if [ ! -f "$COOKIES_FILE" ]; then
    echo "⚠️ 警告: 未找到 cookies 文件 ($COOKIES_FILE)"
    echo "   部分视频可能无法下载"
fi

# 检查链接文件
if [ ! -f "$LINKS_FILE" ]; then
    echo "❌ 错误: 链接文件不存在: $LINKS_FILE"
    exit 1
fi

# 读取链接并处理
echo ""
echo "📋 开始处理 $(wc -l < "$LINKS_FILE") 个链接..."
echo "========================================"

line_num=0
success_count=0
fail_count=0

while IFS= read -r url || [ -n "$url" ]; do
    line_num=$((line_num + 1))
    
    # 跳过空行和注释
    [[ -z "$url" || "$url" =~ ^# ]] && continue
    
    # 提取视频ID
    video_id=$(echo "$url" | grep -oP 'v=([a-zA-Z0-9_-]{11})' | cut -d'=' -f2)
    if [ -z "$video_id" ]; then
        video_id=$(echo "$url" | grep -oP 'youtu\.be/([a-zA-Z0-9_-]{11})' | cut -d'/' -f2)
    fi
    
    if [ -z "$video_id" ]; then
        echo "❌ [$line_num] 无法解析URL: $url"
        fail_count=$((fail_count + 1))
        continue
    fi
    
    # 生成输出文件名
    output_name="video_${video_id}"
    
    echo ""
    echo "📥 [$line_num] 开始处理: $video_id"
    echo "🔗 链接: $url"
    
    # 1. 下载视频
    echo "⬇️  步骤1/3: 下载视频..."
    if yt-dlp --cookies "$COOKIES_FILE" \
        -o "${output_name}.mp4" \
        --format "best[height<=1080]" \
        --merge-output-format mp4 \
        --no-playlist \
        "$url" > /dev/null 2>&1; then
        
        echo "   ✅ 视频下载完成"
        
        # 2. 提取音频
        echo "🎵 步骤2/3: 提取音频..."
        if ffmpeg -i "${output_name}.mp4" \
            -vn -acodec libmp3lame -ab 128k \
            -y "${output_name}.mp3" 2>/dev/null; then
            echo "   ✅ 音频提取完成"
            
            # 3. 语音转文字
            echo "📝 步骤3/3: 语音转文字..."
            if whisper "${output_name}.mp3" \
                --model "$MODEL_SIZE" \
                --output_format srt \
                --output_dir . \
                --language Chinese \
                > /dev/null 2>&1; then
                
                echo "   ✅ 字幕生成完成"
                
                # 转换为纯文本
                if [ -f "${output_name}.srt" ]; then
                    # 去除srt时间戳，只保留文字
                    sed 's/^[0-9]*$//' "${output_name}.srt" | \
                    sed '/^$/d' | \
                    sed 's/<[^>]*>//g' | \
                    sed 's/^[ \t]*//' > "${output_name}.txt"
                    echo "   ✅ 文字稿生成完成"
                fi
                
                success_count=$((success_count + 1))
            else
                echo "   ❌ 语音转文字失败"
                fail_count=$((fail_count + 1))
            fi
            
            # 删除音频文件节省空间
            rm -f "${output_name}.mp3"
        else
            echo "   ❌ 音频提取失败"
            fail_count=$((fail_count + 1))
        fi
        
    else
        echo "   ❌ 视频下载失败"
        fail_count=$((fail_count + 1))
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
done < "$LINKS_FILE"

# 统计报告
echo ""
echo "========================================"
echo "📊 处理完成！"
echo "✅ 成功: $success_count"
echo "❌ 失败: $fail_count"
echo "📁 输出目录: $(pwd)"
echo "========================================"
echo ""
echo "生成的文件:"
ls -lh *.mp4 *.srt *.txt 2>/dev/null | tail -20
