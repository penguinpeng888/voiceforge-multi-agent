#!/bin/bash
WORKDIR="/root/.openclaw/workspace"
LOGFILE="/tmp/pain-point.log"
LAST_RUN="$WORKDIR/.last_pain_point"
MEMORY_FILE="$WORKDIR/memory/痛点挖掘.md"
TODAY=$(date +%Y-%m-%d)

if [ -f "$LAST_RUN" ]; then
    LAST_TIME=$(date -d "$(cat $LAST_RUN)" +%s 2>/dev/null)
    if [ -n "$LAST_TIME" ]; then
        ELAPSED=$(( ($(date +%s) - LAST_TIME) / 3600 ))
        if [ $ELAPSED -lt 80 ]; then
            echo "$(date) 需等待，当前: ${ELAPSED}h" >> $LOGFILE
            exit 0
        fi
    fi
fi

echo "# 痛点挖掘 - $TODAY" > "$MEMORY_FILE"
echo "关键词: app that solves problem" >> "$MEMORY_FILE"
echo "$TODAY" > "$LAST_RUN"
echo "$(date) 完成" >> $LOGFILE
