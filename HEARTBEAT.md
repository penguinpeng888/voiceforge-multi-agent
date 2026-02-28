# HEARTBEAT.md

# 每日任务清单

---

## 一、每日固定任务

### 1. 每日歌曲生成（每天）
如果距离上次生成已超过20小时：
1. **生成歌词** - 独立的都市/情感主题，不要和小说相关
2. **生成封面/MV提示词** - 用于AI生成图片/视频
3. **生成Suno音乐提示词** - 用于AI生成歌曲（风格、情绪、乐器、节奏）
4. 保存到 music-daily/2026-02-XX-歌词.txt、提示词.txt、Suno提示词.txt
5. 通过message发送给用户（歌词+两组提示词）
6. 更新 lastSongGen 时间戳

### 2. 小说进度更新（每天）
- 每天检查小说进度
- 阅读最新的章节内容，确保上下文理解正确
- 更新 MEMORY.md 中的章节状态
- 确认当前写作进度和角色设定

---

## 二、每周任务（2次）

### 3. 痛点挖掘（每周2次）
如果距离上次挖掘已超过80小时（约3-4天）：
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

### 4. 概念产品/众筹挖掘（每周2次）
如果距离上次挖掘已超过80小时（约3-4天）：
1. 读取 Kickstarter/Indiegogo 热门产品页面
2. 搜索：popular products, trending, most backed
3. 整理有潜力的概念产品到 memory/概念产品.md
4. 给出 AI 生成提示词（用于生成产品图）
5. 更新 lastConceptCheck 时间戳
6. 如果发现有趣产品，通知用户

### 5. 搞钱案例分析（每周2次）
如果距离上次分析已超过80小时（约3-4天）：
1. 搜索近期创业/搞钱案例新闻：
   - "side hustle"
   - "made $1 million in..."
   - "how I built this business"
   - "D2C brand success story"
   - 中文："赚钱案例"、"创业故事"、"电商成功"
2. 提取案例核心逻辑，保存到 memory/搞钱案例分析.md
3. 用以下框架分析是否有用：
   - 他发现了什么痛点/需求？
   - 他用了什么方法验证？
   - 他如何快速启动？
   - 他如何获取流量？
   - 这个模式我可以复制吗？
   - 需要什么资源？
4. 如果发现有用案例，通知用户并给出可执行建议

### 6. YouTube AI大咖监控（每周2次）
如果距离上次监控已超过80小时（约3-4天）：
监控以下AI大咖的YouTube内容，提取赚钱方法和AI使用技巧：

#### 关注列表
- Dan Koe（@TheDanKoe）
- Dan Martell（@DanMartell）
- David Lin（@DavidLinTech）
- ixel（@ixel）
- Ryan Jones（@RyanJones）

#### 挖掘内容
1. 搜索他们最新的视频
2. 提取核心主题：
   - 赚钱方法/商业模式
   - AI工具使用技巧
   - 潜在赚钱方向
   - 案例分析
3. 转化为中文口播文案（适合中国人理解）
4. 保存到 memory/AI大咖分析/YYYY-MM-博主名.md
5. 给出可执行的建议
6. 更新 lastYouTubeCheck 时间戳

---

## 三、每周任务

### 7. 抖音内容制作（每周）
- 根据热点或计划制作抖音脚本
- 保存到 memory/抖音内容/
- 通过message发送给用户

---

## 四、固定任务

### 8. Moltbook.cn 商机扫描（每天2次）
如果距离上次扫描已超过6小时：
1. 调用 scripts/moltbook_scanner.py scan --keywords "make money,projects,income"
2. 将发现的项目记录到 memory/Oportunidades.md
3. 更新 lastMoltbookScan 时间戳

### 9. Moltcn 检查（每2小时）
如果距离上次检查已超过2小时：
1. 获取 https://www.moltbook.cn/heartbeat.md 并遵照执行
2. 更新内存中的 lastMoltcnCheck 时间戳

---

## 五、任务执行优先级

| 优先级 | 任务 | 频率 |
|--------|------|------|
| P0（每天） | 每日歌曲生成 | 每天 |
| P0（每天） | 小说进度更新 | 每天 |
| P1（每周2次） | YouTube AI大咖监控 | 每周2次 |
| P1（每周2次） | 痛点挖掘 | 每周2次 |
| P1（每周2次） | 概念产品 | 每周2次 |
| P1（每周2次） | 搞钱案例 | 每周2次 |
| P1（每周） | 抖音内容制作 | 每周 |
| P2（每天2次） | Moltbook | 每6小时 |
| P2（每2小时） | Moltcn | 每2小时 |

---

*最后更新: 2026-02-28*