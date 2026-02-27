#!/bin/bash
# 每日成果发送脚本
# 每天定时发送当日生成的音乐、漫画、小说给主人

DATE=$(date +%Y-%m-%d)
TELEGRAM_ID="5826931720"  # 主人 Peng Penguinpeng 的 Telegram ID

echo "=== $(date) 开始发送当日成果 ==="

# 1. 发送当日音乐
echo "--- 检查音乐文件 ---"
MUSIC_DIR="/root/.openclaw/workspace/music-daily"
if [ -d "$MUSIC_DIR" ]; then
    TODAY_MUSIC=$(ls "$MUSIC_DIR"/$DATE-* 2>/dev/null || echo "")
    if [ -n "$TODAY_MUSIC" ]; then
        echo "找到今日音乐文件: $TODAY_MUSIC"
        # 这里会调用 OpenClaw 的 message 工具发送
    else
        echo "今日暂无音乐文件"
    fi
fi

# 2. 发送当日漫画
echo "--- 检查漫画文件 ---"
MANGA_DIR="/root/.openclaw/workspace/剑起青云-漫画"
if [ -d "$MANGA_DIR" ]; then
    TODAY_MANGA=$(ls "$MANGA_DIR"/$DATE-*.png 2>/dev/null || echo "")
    if [ -n "$TODAY_MANGA" ]; then
        echo "找到今日漫画文件: $TODAY_MANGA"
        # 这里会调用 OpenClaw 的 message 工具发送图片
        for manga_file in $TODAY_MANGA; do
            echo "  待发送: $manga_file"
        done
    else
        echo "今日暂无漫画文件"
    fi
fi

# 3. 发送当日小说进度
echo "--- 检查小说章节 ---"
NOVEL_DIR="/root/.openclaw/workspace/剑起青云"
if [ -d "$NOVEL_DIR" ]; then
    LATEST_CHAPTER=$(ls "$NOVEL_DIR"/第*.txt 2>/dev/null | sort -V | tail -1)
    if [ -n "$LATEST_CHAPTER" ]; then
        echo "最新章节: $LATEST_CHAPTER"
        # 可以发送章节摘要
    fi
fi

echo "=== $(date) 发送检查完成 ==="
echo ""
echo "提示: 实际发送需要通过 OpenClaw message 工具完成"
echo "当前脚本仅做记录和检查"
