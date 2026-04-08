const { VoiceForgeTTS } = require('./voiceforge-tts.js');

const tts = new VoiceForgeTTS({
  engine: 'edge-tts',
  numAgents: 4
});

// 测试长文本，触发分片
const testText = `第一段：这是一个很长的测试文本，我们需要把它分成多个段落。每个Agent处理一段，这样可以并行生成，大幅提升速度。
第二段：海螺AI是一个免费的TTS服务，效果很好。我们可以通过网页自动化来调用它，不需要任何API费用。
第三段：Fish Speech是开源的本地TTS方案，完全免费。只需要一台有GPU的电脑就可以运行。
第四段：Edge TTS是微软的云服务，效果稳定。只需要申请API key就可以使用。`;

tts.parallelSynthesize(testText, {
  output: './test-parallel.mp3',
  voice: 'zh-CN-XiaoxiaoNeural'
})
  .then(result => {
    console.log('\n结果:', JSON.stringify(result, null, 2));
  })
  .catch(err => console.error('错误:', err));