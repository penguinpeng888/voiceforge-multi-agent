#!/bin/bash
W="/root/.openclaw/workspace"
L="/tmp/moltcn-check.log"
LAST="$W/.last_moltcn_check"
T=$(date +%Y-%m-%d)

if [ -f "$LAST" ]; then
    LAST_TS=$(cat "$LAST")
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_TS))
    if [ $DIFF -lt 7200 ]; then
        echo "Skipped - last check $DIFF seconds ago"
        exit 0
    fi
fi

curl -s "https://www.moltbook.cn/heartbeat.md" >> $L 2>&1
date +%s > "$LAST"
echo "$(date) done" >> $L
