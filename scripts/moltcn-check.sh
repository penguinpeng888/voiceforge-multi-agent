#!/bin/bash
W="/root/.openclaw/workspace"
L="/tmp/moltcn-check.log"
LAST="$W/.last_moltcn_check"
T=$(date +%Y-%m-%d)
[ -f "$LAST" ] && [ $(($(date +%s)-$(date -d"$(cat $LAST)" +%s 2>/dev/null || echo 0))/3600) -lt 2 ] && exit 0
curl -s "https://www.moltbook.cn/heartbeat.md" >> $L 2>&1
echo "$T" > "$LAST"
echo "$(date) done" >> $L
