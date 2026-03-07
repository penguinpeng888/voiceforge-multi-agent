#!/bin/bash
# 小说进度更新脚本
WORKDIR="/root/.openclaw/workspace"
NOVEL_DIR="$WORKDIR/novel/JianQiQingYun"
LOGFILE="/tmp/novel-progress.log"
LAST_RUN="$WORKDIR/.last_novel_progress"
TODAY=$(date +%Y-%m-%d)

if [ -f "$LAST_RUN" ] && [ "$(cat $LAST_RUN)" = "$TODAY" ]; then
    echo "$TODAY 已更新，跳过" >> $LOGFILE
    exit 0
fi

cd "$NOVEL_DIR"
LATEST=$(ls -1 *.md 2>/dev/null | grep -E '^[0-9]+\.md$' | sort -t/ -k2 -n | tail -1)

if [ -n "$LATEST" ]; then
    echo "$TODAY" > "$LAST_RUN"
    echo "$(date) 小说进度: $LATEST" >> $LOGFILE
else
    echo "$(date) 未找到章节" >> $LOGFILE
fi