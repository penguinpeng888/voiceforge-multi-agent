#!/bin/bash
WORKDIR="/root/.openclaw/workspace"
LOG="/tmp/youtube-monitor.log"
LAST="$WORKDIR/.last_youtube"
MEM="$WORKDIR/memory/AI大咖分析"
T=$(date +%Y-%m-%d)
if [ -f "$LAST" ]; then E=$(( ($(date +%s) - $(date -d "$(cat $LAST)" +%s 2>/dev/null || echo 0)) / 3600 )); [ $E -lt 80 ] && exit 0; fi
mkdir -p "$MEM"
echo "# YouTube监控 - $T" > "$MEM/$T.md"
echo "博主: Dan Koe, Dan Martell, David Lin" >> "$MEM/$T.md"
echo "$T" > "$LAST"
echo "$(date) done" >> $LOG
