#!/bin/bash
W="/root/.openclaw/workspace"
L="/tmp/concept-product.log"
LAST="$W/.last_concept_product"
T=$(date +%Y-%m-%d)
[ -f "$LAST" ] && [ $(($(date +%s)-$(date -d"$(cat $LAST)" +%s 2>/dev/null || echo 0))/3600) -lt 80 ] && exit 0
echo "# 概念产品 - $T" > "$W/memory/概念产品.md"
echo "$T" > "$LAST"
echo "$(date) done" >> $L
