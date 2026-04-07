#!/bin/bash
# OpenClaw 自动备份脚本
# 有改动才推，安静省心

cd /root/.openclaw/workspace

# 检查是否有改动
if git diff --quiet && git diff --cached --quiet; then
    # 没有改动，退出
    exit 0
fi

# 添加所有改动
git add -A

# 提交（带时间戳）
git commit -m "Backup $(date '+%Y-%m-%d %H:%M')"

# 推送到GitHub
git push origin master:main

echo "Backup completed: $(date)"