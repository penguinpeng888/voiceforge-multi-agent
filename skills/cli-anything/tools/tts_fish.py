#!/usr/bin/env python3
"""
Fish Speech TTS 工具 - 本地运行
"""

import argparse
import subprocess
import os
import torch

def check_gpu():
    """检查GPU是否可用"""
    if torch.cuda.is_available():
        print(f"GPU可用: {torch.cuda.get_device_name(0)}")
        return True
    else:
        print("警告: 无GPU，将使用CPU，速度较慢")
        return False

def tts_fish_speech(text: str, output: str, model: str = "default"):
    """使用Fish Speech生成语音"""
    
    # 检查环境
    check_gpu()
    
    # 构建命令
    cmd = [
        "python", "-m", "fish_audio",
        "--text", text,
        "--output", output,
    ]
    
    if model != "default":
        cmd.extend(["--model", model])
    
    # 执行
    print(f"执行: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"生成完成: {output}")
    else:
        print(f"错误: {result.stderr}")

def main():
    parser = argparse.ArgumentParser(description="Fish Speech TTS 工具")
    parser.add_argument("--text", required=True, help="要转换的文本")
    parser.add_argument("--model", default="default", help="模型选择")
    parser.add_argument("--output", required=True, help="输出文件路径")
    
    args = parser.parse_args()
    tts_fish_speech(args.text, args.output, args.model)

if __name__ == "__main__":
    main()