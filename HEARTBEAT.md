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

# 痛点挖掘（每天1次）
如果距离上次挖掘已超过 20 小时：
1. 用 Exa/MCP 搜索用户痛点关键词：
   - "app that solves...problem"
   - "I wish there was an app..."
   - "frustrated with...app"
   - "best app for...2025"
   - 中文："有没有app可以..."、"这个app太难用了"
2. 整理发现的痛点到 memory/痛点挖掘.md
3. 列出可能的app开发方向
4. 更新 lastPainPointCheck 时间戳
5. 如果发现有趣的痛点，通知用户

# 概念产品/众筹挖掘（每天1次）
如果距离上次挖掘已超过 20 小时：
1. 读取 Kickstarter/Indiegogo 热门产品页面
2. 搜索：popular products, trending, most backed
3. 整理有潜力的概念产品到 memory/概念产品.md
4. 给出 AI 生成提示词（用于生成产品图）
5. 更新 lastConceptCheck 时间戳
6. 如果发现有趣产品，通知用户

