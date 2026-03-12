#!/bin/bash
W="/root/.openclaw/workspace"
L="/tmp/moltbook-scan.log"
LAST="$W/.last_moltbook"

# Check if scanned within 6 hours
if [ -f "$LAST" ]; then
    LAST_TS=$(cat "$LAST")
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_TS))
    if [ $DIFF -lt 21600 ]; then  # 6 hours = 21600 seconds
        echo "Skipped - last scan $DIFF seconds ago"
        exit 0
    fi
fi

# Run scan
cd $W
python3 -c "
import json
import requests

API_KEY = 'moltbook_sk_08XG958K34eDivv96FDs9G5CyhXSru1b'
HEADERS = {'Authorization': f'Bearer {API_KEY}'}

# Get hot posts
resp = requests.get('https://www.moltbook.com/api/v1/posts?sort=hot&limit=10', headers=HEADERS)
posts = resp.json().get('posts', [])
print(f'Found {len(posts)} posts')

# Save to memory
with open('/root/.openclaw/workspace/memory/Oportunidades.md', 'a') as f:
    f.write(f'\\n## {date}\\n')
    for p in posts[:5]:
        f.write(f'- {p.get(\"title\",\"\")[:50]}\\n')
"

# Update timestamp
date +%s > "$LAST"