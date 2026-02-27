#!/bin/bash
# Telegram 文件发送脚本
# 用法: ./send-to-telegram.sh <file_path> <caption>

# 检查参数
if [ -z "$1" ]; then
    echo "用法: $0 <文件路径> [说明文字]"
    exit 1
fi

FILE_PATH="$1"
CAPTION="${2:-}"

# 检查文件是否存在
if [ ! -f "$FILE_PATH" ]; then
    echo "错误: 文件不存在: $FILE_PATH"
    exit 1
fi

# 获取文件名
FILENAME=$(basename "$FILE_PATH")

# 发送文件（通过 OpenClaw message 工具）
# 在实际使用中，这个功能由 OpenClaw 的 message 工具完成
# 这里只是记录要发送的文件信息

echo "待发送文件: $FILE_PATH"
echo "文件名: $FILENAME"
echo "说明: $CAPTION"

# 记录到待发送队列
echo "$FILE_PATH|$CAPTION" >> /root/.openclaw/workspace/.to-send-queue

echo "已加入发送队列"
