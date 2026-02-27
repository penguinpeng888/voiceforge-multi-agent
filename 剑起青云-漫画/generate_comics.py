#!/usr/bin/env python3
"""剑起青云 - 每日漫画生成脚本"""

import os
import sys
from openai import OpenAI
from datetime import datetime

# 配置
WORKSPACE = "/root/.openclaw/workspace/剑起青云-漫画/"
NOVEL_DIR = "/root/.openclaw/workspace/剑起青云/"

# 场景配置：第18章核心场景
SCENES = [
    {
        "name": "01_突破炼气五层",
        "prompt": """Chinese xianxia fantasy art style, a young cultivation protagonist sitting in meditation inside a misty mountain cave, golden spiritual energy swirling around him, breakthrough moment with radiant light emanating from his body, ancient stone walls with moss, a mystical spring glowing with spiritual energy in the corner, dramatic lighting, national comic style, high quality, detailed, Epic scene""",
        "chapter_text": "十五天的苦修，终于迎来了突破的契机。那天清晨，陆沉如往常一样运转噬灵诀，吸收天地灵气。忽然，他感觉经脉中的灵液开始剧烈翻涌，像是一锅沸腾的水。突破了——炼气五层。"
    },
    {
        "name": "02_猪妖变身",
        "prompt": """Chinese xianxia comic style, a giant white pig monster transforming into a terrifying beast, muscular体型巨大的白色野猪妖，浑身散发着上古凶兽的威压，两丈高的身躯占据整个画面，金色灵气环绕，血红色眼睛充满杀意，黑暗的山林背景，国漫风格，震撼场面，高清细节""",
        "chapter_text": "猪猛地窜了出去！它的身体在空中膨胀，化作一头两丈高的巨兽，浑身散发着恐怖的气息。那股威压让三个筑基期高手同时变色。'是那头猪！'国字脸男人显然听说过这件事，'它就是那头变异的猪妖！'"
    },
    {
        "name": "03_以伤换伤",
        "prompt": """Chinese xianxia battle scene, young cultivator charging at a powerful enemy, his body pierced through by a sword from behind, but his sword also stabbing into the enemy's abdomen, blood splashing in all directions, intense close combat, dramatic lighting with golden spiritual energy vs dark evil energy, epic moment of sacrifice, national comic style, highly detailed""",
        "chapter_text": "矮个子的剑刺穿了陆沉的后背，从胸口穿出。剧痛如潮水般涌来。但他的手却没有丝毫颤抖，短剑反而越刺越深。'一起死吧！'他吼道，声音沙哑却充满决绝。"
    },
    {
        "name": "04_噬灵诀吸功",
        "prompt": """Chinese xianxia dark cultivation art, pitch-black energy flowing from dying enemy's body into protagonist's hand, terrifying魔功吸取灵力的场景，黑色的吞噬之力像触手般蔓延，筑基中期高手惊恐绝望的表情，生命力被抽干的恐怖效果，周围空间扭曲，阴暗压抑的氛围，国漫画风，震撼细节""",
        "chapter_text": "噬灵诀全力运转，国字脸男人体内的灵气被源源不断地吸走，像是被拧干的海绵。他的修为在暴跌，气息在衰竭。'不……不要……'他求饶了，声音带着颤抖。但陆沉不会手软。"
    },
    {
        "name": "05_逃亡万妖岭",
        "prompt": """Chinese xianxia landscape, moonlight穿过树冠洒落，一人一道白色身影在黑暗的原始森林中疾驰，后面隐约可见追兵的火光，巨大的古树藤蔓缠绕，雾气弥漫的万妖岭，紧张危险的氛围，逃亡的场景，国漫风景画风格，唯美震撼""",
        "chapter_text": "夜色降临，万妖岭一片漆黑。他们借着夜色掩护，向万妖岭深处逃去。后面是周家的追兵，前面是未知的危险。但他们没有选择。"
    },
]

def generate_comic_image(client, scene, output_path):
    """生成单张漫画图片"""
    print(f"正在生成: {scene['name']}...")
    
    response = client.images.generate(
        model="dall-e-3",
        prompt=scene["prompt"],
        size="1024x1024",
        quality="standard",
        n=1,
    )
    
    image_url = response.data[0].url
    
    # 下载图片
    import urllib.request
    try:
        urllib.request.urlretrieve(image_url, output_path)
        print(f"✓ 已保存: {output_path}")
        return True
    except Exception as e:
        print(f"✗ 下载失败: {e}")
        return False

def main():
    # 初始化客户端
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("错误: 未设置 OPENAI_API_KEY")
        sys.exit(1)
    
    client = OpenAI(api_key=api_key)
    
    # 生成日期前缀
    date_prefix = datetime.now().strftime("%Y-%m-%d")
    
    print(f"\n{'='*50}")
    print(f"剑起青云 - 每日漫画生成任务")
    print(f"时间: {date_prefix}")
    print(f"章节: 第18章 - 危机逼近")
    print(f"{'='*50}\n")
    
    generated_files = []
    
    for i, scene in enumerate(SCENES, 1):
        output_file = f"{WORKSPACE}{date_prefix}-漫画-{i:02d}.png"
        
        success = generate_comic_image(client, scene, output_file)
        if success:
            generated_files.append({
                "file": output_file,
                "name": scene["name"],
                "caption": scene["chapter_text"]
            })
        print()
    
    # 输出摘要
    print(f"\n{'='*50}")
    print(f"生成完成: {len(generated_files)}/{len(SCENES)} 张图片")
    print(f"{'='*50}")
    
    # 输出文件列表供后续处理
    for f in generated_files:
        print(f"  - {f['file']}")
    
    return generated_files

if __name__ == "__main__":
    main()
