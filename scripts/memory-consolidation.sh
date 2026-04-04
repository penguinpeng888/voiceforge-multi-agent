#!/bin/bash
# 记忆整合脚本 - 每天凌晨执行
# 读取本周所有 memory/YYYY-MM-DD.md，提炼重要信息更新到 MEMORY.md

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
MEMORY_FILE="$WORKSPACE/MEMORY.md"

echo "=== 记忆整合开始 ==="
echo "时间: $(date -u +%Y-%m-%dT%H:%MZ)"

# 获取本周的日期列表
CURRENT_WEEK_DAYS=""
for i in {0..6}; do
    DATE=$(date -u -d "$i days ago" +%Y-%m-%d)
    if [ -f "$MEMORY_DIR/$DATE.md" ]; then
        CURRENT_WEEK_DAYS="$CURRENT_WEEK_DAYS $DATE"
    fi
done

if [ -z "$CURRENT_WEEK_DAYS" ]; then
    echo "本周没有记忆文件需要整合"
    exit 0
fi

echo "本周记忆文件: $CURRENT_WEEK_DAYS"

# 创建临时文件存储要追加的内容
TEMP_FILE=$(mktemp)
echo "## 本周整合（$(date -u +%Y-%m-%d)）" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 合并所有"今日重要记忆"部分
echo "### 重要记忆" >> "$TEMP_FILE"

for DATE_FILE in $CURRENT_WEEK_DAYS; do
    # 提取"今日重要记忆"或"## 今日重要记忆"后的内容
    CONTENT=$(sed -n '/## 今日重要记忆/,/^## /p' "$MEMORY_DIR/$DATE_FILE.md" 2>/dev/null | head -50)
    if [ -n "$CONTENT" ]; then
        echo "- $DATE_FILE:" >> "$TEMP_FILE"
        echo "$CONTENT" | grep -E "^\s*-\s+" | head -5 >> "$TEMP_FILE"
    fi
done

# 追加到MEMORY.md
# 检查是否已经有"本周整合"部分
if ! grep -q "## 本周整合" "$MEMORY_FILE"; then
    echo "" >> "$MEMORY_FILE"
    cat "$TEMP_FILE" >> "$MEMORY_FILE"
    echo "✅ 已整合到 MEMORY.md"
else
    echo "⚠️ 本周已整合过，跳过"
fi

rm -f "$TEMP_FILE"
echo "=== 记忆整合完成 ==="