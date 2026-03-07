#!/bin/bash
W="/root/.openclaw/workspace"
L="/tmp/make-money.log"
LAST="$W/.last_make_money"
T=$(date +%Y-%m-%d)
[ -f "$LAST" ] && [ $(($(date +%s)-$(date -d"$(cat $LAST)" +%s 2>/dev/null || echo 0))/3600) -lt 80 ] && exit 0
echo "# 搞钱案例 - $T" > "$W/memory/搞钱案例分析.md"
echo "$T" > "$LAST"
echo "$(date) done" >> $L
