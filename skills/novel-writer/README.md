# Novel Writer Automation Script

小说创作自动化脚本 - 集成写作技法、逻辑检查、字数统计

## 功能

1. **自动加载写作技法** - 每次写新章节前自动读取 openclaw-writing-skills
2. **逻辑检查** - 检查战力设定、时间线、因果逻辑
3. **字数统计** - 实时统计章节字数
4. **输出格式化** - 生成标准 Markdown 格式章节文件

## 使用方法

```bash
# 生成新章节
python3 scripts/novel-writer.py --chapter 17 --title "章节标题" --target-words 4000

# 检查已有章节逻辑
python3 scripts/novel-writer.py --check /path/to/chapter.md

# 统计字数
python3 scripts/novel-writer.py --count /path/to/chapter.md

# 准备发送文件（以文件形式发送）
python3 scripts/novel-writer.py --send /path/to/chapter.md
```

## 发送章节文件

发送小说章节给用户时，必须以**文件形式**发送，而不是对话内容：

```python
from message import send

# 错误方式：直接发送文本内容
message="""# 第16章：正面交锋
陆沉站在小院门口...
"""

# 正确方式：使用 path 参数发送文件
message(action="send", path="/root/.openclaw/workspace/剑起青云/第16章-正面交锋.md")
```

## 依赖

- 需要先安装 `openclaw-writing-skills` skill
- 需要 `openclaw-writing-skills/SKILL.md` 存在

## 逻辑检查规则

### 战力设定检查
- 主角修为 vs 敌人修为 差距不能超过3层（除非有特殊原因）
- 越级战斗必须有合理的弥补因素（法宝、计谋、环境优势等）
- 战斗结果必须符合设定（惨胜/险胜/秒杀都要有铺垫）

### 时间线检查
- 明确标注时间（天数、时辰）
- 修炼时间要合理（突破需要多久）
- 伤口愈合时间要符合常理

### 因果逻辑
- 敌人能找到主角必须有合理原因（追踪、线索、背叛等）
- 主角能获胜必须有合理原因（准备、优势、利用敌人弱点）
- 任何"巧合"都必须有前文铺垫

## 输出格式

生成的章节文件包含：
- 章节号和标题
- 字数统计
- 核心进展列表
- 下章预告
