"""
AI配音主工作流
整合情感分析和语音合成
"""
import json
import argparse
from pathlib import Path
from typing import List, Dict, Optional
from src.emotion_analyzer import EmotionAnalyzer
from src.voice_synthesizer import VoiceSynthesizer
from config import OUTPUT_DIR, VOICE_LIBRARY


class DubbingPipeline:
    """AI配音流水线"""
    
    def __init__(self):
        self.emotion_analyzer = EmotionAnalyzer()
        self.voice_synthesizer = VoiceSynthesizer()
    
    def process_text(
        self, 
        text: str, 
        voice: str = "narrator",
        output_dir: Path = None
    ) -> Dict:
        """
        处理单段文本
        
        Args:
            text: 文本内容
            voice: 音色名称
            output_dir: 输出目录
            
        Returns:
            处理结果字典
        """
        output_dir = output_dir or OUTPUT_DIR
        
        # 1. 情感分析
        print("分析情感...")
        emotion_result = self.emotion_analyzer.analyze(text)
        
        # 2. 语音合成
        print(f"合成语音 (音色: {voice}, 情感: {emotion_result.get('emotion')})...")
        output_path = output_dir / f"output_{hash(text)}.mp3"
        
        audio_data = self.voice_synthesizer.synthesize_with_voice_name(
            text=text,
            voice_name=voice,
            emotion=emotion_result.get("emotion", "neutral"),
            output_path=str(output_path)
        )
        
        return {
            "text": text,
            "emotion_analysis": emotion_result,
            "audio_path": str(output_path),
            "audio_size": len(audio_data)
        }
    
    def process_chapter(
        self, 
        chapter_text: str,
        chapter_name: str = "chapter1",
        split_by: str = "paragraph"
    ) -> List[Dict]:
        """
        处理整章小说
        
        Args:
            chapter_text: 章节文本
            chapter_name: 章节名称
            split_by: 分割方式 (paragraph/sentence)
            
        Returns:
            处理结果列表
        """
        # 分割文本
        if split_by == "paragraph":
            segments = [p.strip() for p in chapter_text.split("\n\n") if p.strip()]
        else:
            # 按句子分割（简单实现）
            segments = [s.strip() for s in chapter_text.split("。") if s.strip()]
            segments = [s + "。" for s in segments]
        
        print(f"分割为 {len(segments)} 个段落")
        
        results = []
        chapter_output_dir = OUTPUT_DIR / chapter_name
        chapter_output_dir.mkdir(exist_ok=True)
        
        for i, segment in enumerate(segments):
            print(f"\n[{i+1}/{len(segments)}] 处理段落...")
            
            # 判断段落类型
            emotion_result = self.emotion_analyzer.analyze(segment)
            narrative_type = emotion_result.get("narrative_type", "描写")
            
            # 选择音色
            if narrative_type == "对话":
                # 检查角色
                voice = "young_male"  # 默认
                for char in emotion_result.get("characters", []):
                    role = char.get("role", "")
                    if role == "主角":
                        voice = "young_male"
                    elif role == "反派":
                        voice = "warrior"
                    elif role == "老年角色":
                        voice = "elder_male"
                    break
            elif "战斗" in emotion_result.get("emotion", ""):
                voice = "warrior"
            else:
                voice = "narrator"
            
            # 合成语音
            output_path = chapter_output_dir / f"segment_{i:03d}.mp3"
            
            try:
                audio_data = self.voice_synthesizer.synthesize_with_voice_name(
                    text=segment,
                    voice_name=voice,
                    emotion=emotion_result.get("emotion", "neutral"),
                    output_path=str(output_path)
                )
                
                results.append({
                    "segment_index": i,
                    "text": segment,
                    "voice": voice,
                    "emotion_analysis": emotion_result,
                    "audio_path": str(output_path),
                    "audio_size": len(audio_data)
                })
                
                print(f"  情感: {emotion_result.get('emotion')} | 音色: {voice} | 音频: {len(audio_data)} bytes")
                
            except Exception as e:
                print(f"  合成失败: {e}")
                results.append({
                    "segment_index": i,
                    "text": segment,
                    "error": str(e)
                })
        
        # 保存元数据
        metadata_path = chapter_output_dir / "metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n元数据已保存到: {metadata_path}")
        
        return results
    
    def create_from_file(
        self,
        input_file: str,
        output_dir: Path = None,
        chapter_name: str = None
    ) -> List[Dict]:
        """
        从文件创建配音
        
        Args:
            input_file: 输入文本文件路径
            output_dir: 输出目录
            chapter_name: 章节名称（默认从文件名提取）
            
        Returns:
            处理结果列表
        """
        input_path = Path(input_file)
        
        if chapter_name is None:
            chapter_name = input_path.stem
        
        # 读取文本
        with open(input_path, "r", encoding="utf-8") as f:
            text = f.read()
        
        return self.process_chapter(text, chapter_name)


def demo():
    """演示模式"""
    pipeline = DubbingPipeline()
    
    # 测试单段文本
    test_text = "陆沉手持长剑，目光如刀，直视对面的黑纹豹。体内的灵气运转，噬灵诀的力量在经脉中流淌。",
    
    print("=" * 50)
    print("AI配音演示")
    print("=" * 50)
    
    result = pipeline.process_text(test_text, voice="warrior")
    
    print("\n结果:")
    print(f"  情感: {result['emotion_analysis'].get('emotion')}")
    print(f"  场景: {result['emotion_analysis'].get('scene_type')}")
    print(f"  背景音乐建议: {result['emotion_analysis'].get('background_music')}")
    print(f"  音频文件: {result['audio_path']}")
    print(f"  音频大小: {result['audio_size']} bytes")


def main():
    """主入口"""
    parser = argparse.ArgumentParser(description="AI配音流水线")
    parser.add_argument("--input", "-i", help="输入文本文件")
    parser.add_argument("--output", "-o", help="输出目录")
    parser.add_argument("--chapter", "-c", help="章节名称")
    parser.add_argument("--demo", "-d", action="store_true", help="运行演示")
    parser.add_argument("--text", "-t", help="直接输入文本")
    parser.add_argument("--voice", "-v", default="narrator", help="音色名称")
    
    args = parser.parse_args()
    
    if args.demo:
        demo()
    elif args.text:
        pipeline = DubbingPipeline()
        result = pipeline.process_text(args.text, voice=args.voice)
        print(f"音频已生成: {result['audio_path']}")
    elif args.input:
        pipeline = DubbingPipeline()
        output_dir = Path(args.output) if args.output else OUTPUT_DIR
        results = pipeline.create_from_file(args.input, output_dir, args.chapter)
        print(f"处理完成，共 {len(results)} 个段落")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()