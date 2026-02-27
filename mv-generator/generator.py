#!/usr/bin/env python3
"""
AI MV 生成器
根据歌词自动生成 AI 视频，再合成 MV

工作流：
1. 歌词 → 生成场景提示词
2. Runway ML/Pika → 生成视频片段
3. FFmpeg → 合成最终 MV
"""

import os
import json
from datetime import datetime

# 配置
WORKSPACE = "/root/.openclaw/workspace"
MV_DIR = os.path.join(WORKSPACE, "mv-generator")

# 歌词分析 → 场景提取
def analyze_lyrics_to_scenes(lyrics):
    """分析歌词，提取关键场景"""
    scenes = []
    
    # 关键词匹配场景
    keywords = {
        "巷口的风": {
            "prompt": "Chinese old alleyway at night, warm yellow lanterns, misty atmosphere, traditional houses, cinematic 4k, gentle camera movement",
            "duration": 8
        },
        "老巷口": {
            "prompt": "Old Chinese street corner, vintage lanterns, cobblestone road, evening golden hour, nostalgic mood, cinematic wide shot",
            "duration": 6
        },
        "月亮": {
            "prompt": "Full moon in night sky, soft moonlight through window, silhouette of man with guitar, warm hopeful tone, Chinese ink painting style",
            "duration": 8
        },
        "江南": {
            "prompt": "Classic Jiangnan watertown, small bridge over river, traditional Chinese architecture, misty morning, nostalgic melody, cinematic",
            "duration": 6
        },
        "便利店": {
            "prompt": "Modern convenience store at night, bright fluorescent lights, lonely office worker looking at phone, city night view, melancholic mood, cinematic shot",
            "duration": 6
        },
        "咖啡": {
            "prompt": "Coffee shop corner, warm brown tones, steam rising from cup, late night studying, hopeful eyes, soft lighting, intimate close-up",
            "duration": 5
        },
        "吉他": {
            "prompt": "Man playing acoustic guitar in dim room, warm lamp light, emotional performance, bokeh background, intimate atmosphere, cinematic",
            "duration": 8
        },
        "星星": {
            "prompt": "Starry night sky over city, twinkling stars, city lights below, hopeful mood, wide cinematic shot, 4k",
            "duration": 5
        },
        "霓虹": {
            "prompt": "Neon lights in rainy street, reflection on wet pavement, jazz club atmosphere, saxophone player silhouette, sophisticated mood",
            "duration": 6
        },
        "日出": {
            "prompt": "Sunrise over city skyline, golden light breaking through clouds, hopeful new beginning, inspirational mood, epic wide shot",
            "duration": 6
        }
    }
    
    lines = lyrics.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('[') or line.startswith('（') or line.startswith('('):
            continue
            
        # 检测关键词
        for key, scene in keywords.items():
            if key in line:
                # 检查是否已在场景列表中
                if not scenes or scenes[-1]["keyword"] != key:
                    scenes.append({
                        "keyword": key,
                        "prompt": scene["prompt"],
                        "duration": scene["duration"],
                        "lyric": line
                    })
    
    return scenes

def generate_pika_command(scenes):
    """生成 Pika Labs 的 Discord 命令"""
    commands = []
    for i, scene in enumerate(scenes):
        cmd = f"/create \"{scene['prompt']}\" --aspect 16:9 --length 3s"
        commands.append((i+1, scene["keyword"], cmd, scene["duration"]))
    return commands

def create_mv_script(scenes, audio_file):
    """生成 FFmpeg 合成脚本"""
    script_lines = [
        "#!/bin/bash",
        f"# MV 合成脚本 - 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "AUDIO_FILE=\"" + audio_file + "\"",
        "OUTPUT_FILE=\"final_mv.mov\"",
        "",
        "# 检查文件是否存在",
        "for i in $(seq 1 " + str(len(scenes)) + "); do",
        '    if [ ! -f "video_$(printf "%02d" $i).mp4" ]; then',
        '        echo "错误: 找不到 video_$(printf "%02d" $i).mp4"',
        "        exit 1",
        "    fi",
        "done",
        "",
        "# 合并视频",
        'FFMPEG_CMD="ffmpeg -y"',
        ""
    ]
    
    for i in range(len(scenes)):
        script_lines.append(f'  FFMPEG_CMD="$FFMPEG_CMD -i video_{i+1:02d}.mp4"')
    
    script_lines.append(f'  FFMPEG_CMD="$FFMPEG_CMD -i \\"$AUDIO_FILE\\""')
    script_lines.append('  FFMPEG_CMD="$FFMPEG_CMD -filter_complex \\"[0:v]concat=n=' + str(len(scenes)) + ':v=1:a=0[out]\\" -map \\"[out]\\" -map 1:a -c:v libx264 -c:a aac -shortest \\"$OUTPUT_FILE\\""')
    script_lines.append("")
    script_lines.append("eval $FFMPEG_CMD")
    script_lines.append('echo "MV 生成完成: $OUTPUT_FILE"')
    
    return "\n".join(script_lines)

def main():
    print("=" * 50)
    print("🎬 AI MV 生成器")
    print("=" * 50)
    
    # 查找歌词文件
    today = datetime.now().strftime('%Y-%m-%d')
    lyrics_file = os.path.join(WORKSPACE, "music-daily", f"{today}-歌词.txt")
    yesterday_file = os.path.join(WORKSPACE, "music-daily", f"2026-02-23-歌词.txt")
    
    if os.path.exists(lyrics_file):
        LYRICS_FILE = lyrics_file
    elif os.path.exists(yesterday_file):
        LYRICS_FILE = yesterday_file
    else:
        print(f"❌ 找不到歌词文件")
        print(f"  查找路径: {lyrics_file}")
        return
    
    # 1. 读取歌词
    with open(LYRICS_FILE, 'r', encoding='utf-8') as f:
        lyrics = f.read()
    
    print(f"✅ 已读取歌词，共 {len(lyrics)} 字")
    
    # 2. 分析场景
    scenes = analyze_lyrics_to_scenes(lyrics)
    print(f"✅ 提取了 {len(scenes)} 个场景")
    
    if len(scenes) == 0:
        print("⚠️ 未找到匹配的场景关键词，使用默认场景")
        scenes = [{
            "keyword": "默认场景",
            "prompt": "Beautiful Chinese landscape, traditional and modern blend, cinematic 4k, atmospheric lighting",
            "duration": 5,
            "lyric": "默认场景"
        }]
    
    # 3. 生成 Pika 命令
    pika_cmds = generate_pika_command(scenes)
    
    print("\n" + "=" * 50)
    print("📝 Pika Labs Discord 命令")
    print("=" * 50)
    for i, keyword, cmd, duration in pika_cmds:
        print(f"\n场景{i}: {keyword} (约{duration}秒)")
        print(f"命令: {cmd}")
    
    # 4. 生成 FFmpeg 脚本
    ff_script = create_mv_script(scenes, "song.mp3")
    ff_path = os.path.join(MV_DIR, "合成脚本.sh")
    with open(ff_path, 'w', encoding='utf-8') as f:
        f.write(ff_script)
    print(f"\n✅ FFmpeg 合成脚本已保存: {ff_path}")
    
    # 5. 生成场景 JSON
    scene_data = {
        "lyrics_file": LYRICS_FILE,
        "generated_at": datetime.now().isoformat(),
        "scenes": scenes,
        "total_duration": sum(s["duration"] for s in scenes)
    }
    
    json_path = os.path.join(MV_DIR, "scenes.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(scene_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 场景数据已保存: {json_path}")
    
    print("\n" + "=" * 50)
    print("🎯 下一步操作")
    print("=" * 50)
    print("""
1. 在 Pika Labs Discord 中运行上面的命令，生成视频片段
2. 把生成的视频片段保存到 mv-generator 目录，命名为 video_01.mp4, video_02.mp4...
3. 把歌曲文件重命名为 song.mp3，放到 mv-generator 目录
4. 运行: bash 合成脚本.sh
5. 得到最终 MV: final_mv.mov
""")

if __name__ == "__main__":
    main()
