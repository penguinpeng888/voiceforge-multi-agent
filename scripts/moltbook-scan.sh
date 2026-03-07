#!/bin/bash
W="/root/.openclaw/workspace"
L="/tmp/moltbook-scan.log"
LAST="$W/.last_moltbook"
T=$(date +%Y-%m-%d)
[ -f "$LAST" ] && [ $(($(date +%s)-$(date -d"$(cat $LAST)" +%s 2>/dev/null || echo 0))/3600) -lt 6 ] && exit 0
python3 $W/scripts/moltbook_scanner.py scan --keywords "make money,projects,income" >> $L 2>&1
echo "$T" > "$LAST"
