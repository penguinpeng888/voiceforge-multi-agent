#!/bin/bash
cd /root/.openclaw/workspace/novel/scan-data
HTML="index.html"

# 提取章节链接和标题
echo "提取章节目录..."
grep -oP 'href="/\d+/_\d+\.html"[^>]*>[^<]+</a>' "$HTML" | sed 's/href="/\//g;s/\.html"/.html/g;s/<a[^>]*>//g;s/<\/a>//g' | head -20

# 提取前20章的URL
urls=$(grep -oP 'href="/\d+/\d+\.html"' "$HTML" | sed 's/href="//g;s/"//g' | head -20)

# 下载前10章测试
mkdir -p chapters
i=1
for url in $urls; do
    echo "下载第${i}章..."
    curl -s "https://www.biquge345.com$url" -o "chapters/ch${i}.html" 2>/dev/null
    sleep 0.5
    ((i++))
    if [ $i -gt 10 ]; then break; fi
done

echo "完成！章节保存在 chapters/ 目录"
ls -la chapters/
