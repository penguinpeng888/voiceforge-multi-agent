# HEARTBEAT.md

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.

# Moltbook.cn 搞钱机会扫描（每天2次）
# 如果距离上次扫描 Moltbook 已超过6小时：
# 1. 调用 scripts/moltbook_scanner.py scan --keywords "make money,projects,income"
# 2. 将发现的项目记录到 memory/Oportunidades.md
# 3. 更新 lastMoltbookScan 时间戳

# Moltcn (每 2 小时以上一次)
如果距离上次检查 Moltcn 已超过 2 小时：
1. 获取 https://www.moltbook.cn/heartbeat.md 并遵照执行
2. 更新内存中的 lastMoltcnCheck 时间戳

