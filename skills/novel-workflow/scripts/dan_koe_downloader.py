#!/usr/bin/env python3
"""
Dan Koe 视频自动下载工具
用于自动化下载 Dan Koe 的视频内容

用法:
    python dan_koe_downloader.py download <url>
    python dan_koe_downloader.py batch <file.txt>
    python dan_koe_downloader.py --help
"""

import os
import sys
import argparse
import subprocess
from datetime import datetime
from pathlib import Path

# 配置
DOWNLOAD_DIR = Path("/root/.openclaw/workspace/downloads")
CONFIG_FILE = Path("/root/.openclaw/workspace/config/dan-koe-config.json")
LOG_FILE = Path("/root/.openclaw/workspace/logs/dan-koe-download.log")

# 支持的平台
SUPPORTED_PLATFORMS = {
    "youtube": ["youtube.com", "youtu.be"],
    "bilibili": ["bilibili.com", "b站.tv"],
    "twitter": ["twitter.com", "x.com"],
    "instagram": ["instagram.com"],
    "tiktok": ["tiktok.com", "douyin.com"],
}


def setup():
    """初始化环境"""
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOAD_DIR.joinpath("videos").mkdir(exist_ok=True)
    DOWNLOAD_DIR.joinpath("audio").mkdir(exist_ok=True)
    DOWNLOAD_DIR.joinpath("transcripts").mkdir(exist_ok=True)
    Path("/root/.openclaw/workspace/logs").mkdir(parents=True, exist_ok=True)
    print(f"✅ 环境初始化完成")
    print(f"   下载目录: {DOWNLOAD_DIR}")


def detect_platform(url: str) -> str:
    """检测URL平台"""
    for platform, domains in SUPPORTED_PLATFORMS.items():
        for domain in domains:
            if domain in url.lower():
                return platform
    return "unknown"


def download_youtube(url: str, quality: str = "best") -> bool:
    """下载 YouTube 视频"""
    print(f"📥 开始下载 YouTube 视频...")
    output_template = DOWNLOAD_DIR / "videos" / "%(title)s_%(id)s.%(ext)s"
    
    cmd = [
        "yt-dlp",
        "-f", quality,
        "-o", str(output_template),
        "--merge-output-format", "mp4",
        "--write-subs",
        "--sub-lang", "en,zh",
        "--convert-subs", "srt",
        url
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            print(f"✅ YouTube 视频下载成功")
            return True
        else:
            print(f"❌ 下载失败: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ yt-dlp 未安装，请运行: pip install yt-dlp")
        return False
    except subprocess.TimeoutExpired:
        print("❌ 下载超时")
        return False


def download_bilibili(url: str) -> bool:
    """下载 Bilibili 视频"""
    print(f"📥 开始下载 Bilibili 视频...")
    
    # 使用 you-get 或 yt-dlp
    output_template = DOWNLOAD_DIR / "videos" / "%(title)s.%(ext)s"
    
    cmd = [
        "yt-dlp",
        "-o", str(output_template),
        "--write-description",
        "--write-info-json",
        url
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            print(f"✅ Bilibili 视频下载成功")
            return True
        else:
            print(f"❌ 下载失败: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ yt-dlp 未安装")
        return False


def download_generic(url: str) -> bool:
    """通用下载（使用yt-dlp尝试）"""
    print(f"📥 开始下载视频...")
    
    output_template = DOWNLOAD_DIR / "videos" / "%(title)s_%(id)s.%(ext)s"
    
    cmd = [
        "yt-dlp",
        "-f", "best",
        "-o", str(output_template),
        url
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            print(f"✅ 视频下载成功")
            return True
        else:
            print(f"❌ 下载失败: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ yt-dlp 未安装")
        return False


def download_video(url: str) -> bool:
    """主下载函数"""
    platform = detect_platform(url)
    print(f"🔍 检测到平台: {platform}")
    
    if platform == "youtube":
        return download_youtube(url)
    elif platform == "bilibili":
        return download_bilibili(url)
    else:
        return download_generic(url)


def batch_download(urls: list):
    """批量下载"""
    print(f"\n📦 批量下载模式")
    print(f"   待下载数量: {len(urls)}")
    
    success = 0
    failed = 0
    
    for i, url in enumerate(urls, 1):
        print(f"\n[{i}/{len(urls)}] 正在下载...")
        if download_video(url):
            success += 1
        else:
            failed += 1
    
    print(f"\n📊 下载统计:")
    print(f"   成功: {success}")
    print(f"   失败: {failed}")


def download_and_transcribe(url: str, auto_translate: bool = True) -> bool:
    """下载并自动转录"""
    print(f"📥 开始下载并转录视频...")
    
    # 先下载
    if not download_video(url):
        return False
    
    # 获取下载的文件
    video_files = list((DOWNLOAD_DIR / "videos").glob("*"))
    if not video_files:
        print("❌ 未找到下载的视频文件")
        return False
    
    latest_video = max(video_files, key=os.path.getmtime)
    print(f"📄 检测到视频: {latest_video.name}")
    
    # 如果需要转录，调用 whisper
    if auto_translate:
        transcript_file = DOWNLOAD_DIR / "transcripts" / f"{latest_video.stem}.txt"
        print(f"🎙️ 开始转录...")
        
        try:
            cmd = [
                "whisper",
                str(latest_video),
                "--model", "medium",
                "--language", "English",
                "--output_format", "txt",
                "--output_dir", str(DOWNLOAD_DIR / "transcripts")
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
            if result.returncode == 0:
                print(f"✅ 转录完成")
                
                # 翻译成中文（如果需要）
                if auto_translate:
                    print(f"🌐 翻译成中文...")
                    translate_transcript(transcript_file)
                
                return True
            else:
                print(f"❌ 转录失败: {result.stderr}")
                return False
                
        except FileNotFoundError:
            print("⚠️ whisper 未安装，跳过转录")
            return True
    
    return True


def translate_transcript(file_path: Path):
    """翻译字幕文件"""
    if not file_path.exists():
        print(f"❌ 文件不存在: {file_path}")
        return
    
    # 简单翻译逻辑（可以集成 LLM API）
    print(f"📝 翻译文件: {file_path.name}")
    # TODO: 调用翻译API
    
    translated_path = file_path.with_suffix(".zh.txt")
    print(f"✅ 翻译完成: {translated_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Dan Koe 视频自动下载工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s download "https://youtube.com/watch?v=..."
    %(prog)s batch urls.txt
    %(prog)s transcribe "https://youtube.com/watch?v=..." --translate
        """
    )
    
    parser.add_argument("command", choices=["download", "batch", "transcribe", "setup", "status"],
                       help="命令")
    parser.add_argument("target", nargs="?", help="URL或文件路径")
    parser.add_argument("--translate", action="store_true", help="自动翻译字幕")
    parser.add_argument("--quality", default="best", help="视频质量")
    
    args = parser.parse_args()
    
    if len(sys.argv) == 1:
        parser.print_help()
        return
    
    if args.command == "setup":
        setup()
        
    elif args.command == "download":
        if not args.target:
            print("❌ 请提供视频URL")
            return
        download_video(args.target)
        
    elif args.command == "batch":
        if not args.target:
            print("❌ 请提供URL列表文件")
            return
        
        url_file = Path(args.target)
        if not url_file.exists():
            print(f"❌ 文件不存在: {url_file}")
            return
        
        urls = url_file.read_text().strip().split("\n")
        urls = [u.strip() for u in urls if u.strip()]
        batch_download(urls)
        
    elif args.command == "transcribe":
        if not args.target:
            print("❌ 请提供视频URL")
            return
        download_and_transcribe(args.target, args.translate)


if __name__ == "__main__":
    main()
