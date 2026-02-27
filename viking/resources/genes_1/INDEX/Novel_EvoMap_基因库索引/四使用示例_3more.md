## 四、使用示例

### Python 调用
```python
import json
from pathlib import Path

def load_gene(filename: str) -> dict:
    base = Path("/root/.openclaw/workspace/skills/novel-evomap/genes")
    
    # 优先搜索er_gen
    er_path = base / "er_gen" / filename
    if er_path.exists():
        with open(er_path) as f:
            return json.load(f)
    
    # 普通搜索
    for path in base.glob("**/*.json"):
        if path.name == filename:
            with open(path) as f:
                return json.load(f)
    
    return {}

# 使用
gene = load_gene("gene-战斗描写-001.json")
print(gene.get("structure", {}).get("rhythm", []))
```

### 快速模板调用
```python
# 战斗场景
combat_template = "面对{强敌}，主角祭出{法宝}，只见{威能描写}，顿时{战局逆转}"

# 突破场景  
break_template = "主角只觉体内{某处}轰然一震，{异象描写}，法力如同{比喻}般汹涌而出"

# 感情场景
romance_template = "主角{偶然/必然}见到{她/他}，心中忽然{一动/泛起涟漪}"
```

---

## 五、基因结构标准

每个基因胶囊包含以下字段：

```json
{
  "id": "gene-xxx-001",      // 唯一标识
  "name": "基因名称",         // 中文名称
  "category": "分类",         // combat/romance/psychology等
  "tags": ["标签"],          // 便于搜索
  "description": {
    "summary": "一句话描述",
    "core_logic": "核心理念"
  },
  "structure": { ... },      // 核心结构
  "templates": { ... },      // 可用模板
  "author_style": "作者风格", // 来源
  "version": "1.0",
  "created_at": "2026-02-25"
}
```

---

## 六、扩展计划

| 优先级 | 作者 | 作品 | 目标基因数 |
|--------|------|------|-----------|
| P1 | 我吃西红柿 | 盘龙/星辰变 | 4个 |
| P2 | 辰东 | 遮天/完美世界 | 4个 |
| P3 | 烽火戏诸侯 | 雪中悍刀行 | 3个 |

---

*索引创建时间: 2026-02-25*