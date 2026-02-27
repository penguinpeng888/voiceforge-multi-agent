# Novel EvoMap 基因库索引

> 最后更新: 2026-02-25

---

## 一、基因库概览

```
genes/
├── combat.json          # 战斗类基础基因
├── dialogue.json        # 对话类基础基因
├── environment.json     # 环境类基础基因
├── psychology.json      # 心理类基础基因
│
├── wangyu_gen/          # 忘语基因库（凡人修仙传）
│   ├── gene-weapon-treasure.json
│   ├── gene-修炼突破-001.json
│   ├── gene-感情互动-001.json
│   ├── gene-战斗描写-001.json
│   ├── gene-心理活动-001.json
│   └── style-fanren-ch1.json
│
└── er_gen/              # 耳根基因库（仙逆）
    ├── gene-ergen-torment-001.json    # 虐心情感
    ├── gene-ergen-daoheart-001.json   # 道心考验
    └── gene-ergen-sacrifice-001.json  # 牺牲救赎
```

---

## 二、快速调用指南

### 2.1 按功能调用

| 功能 | 调用文件 | 关键字段 |
|------|----------|----------|
| **战斗描写** | `gene-战斗描写-001.json` | components, rhythm |
| **法宝运用** | `gene-weapon-treasure.json` | levels, power_display, templates |
| **修炼突破** | `gene-修炼突破-001.json` | phases, templates, timing_rules |
| **感情互动** | `gene-感情互动-001.json` | phases, techniques |
| **心理活动** | `gene-心理活动-001.json` | patterns, principles |
| **虐心情感** | `er_gen/gene-ergen-torment-001.json` | patterns, techniques |
| **道心考验** | `er_gen/gene-ergen-daoheart-001.json` | phases |
| **牺牲救赎** | `er_gen/gene-ergen-sacrifice-001.json` | sacrifice_types |

### 2.2 按作者调用

| 作者 | 作品 | 基因数 | 主要特点 |
|------|------|--------|----------|
| 忘语 | 凡人修仙传 | 6个 | 朴实无华、法宝体系、冷静叙述 |
| 耳根 | 仙逆 | 3个 | 虐心执着、道心考验、牺牲悲壮 |

---

## 三、基因详情

### 3.1 忘语系列

#### gene-weapon-treasure.json - 法宝运用技法
```json
{
  "levels": [
    {"level": "入门级", "names": ["飞剑", "灵刀"]},
    {"level": "灵宝级", "names": ["青竹蜂云剑"]},
    {"level": "通天灵宝", "names": ["玄天斩灵剑"]}
  ],
  "power_display": ["对比衬托", "功能展示", "特效描写", "代价设定"]
}
```

#### gene-修炼突破-001.json - 修炼突破描写
```json
{
  "phases": ["积累期", "契机", "突破", "稳固"],
  "timing_rules": {"小境界": "每10-15章", "大境界": "每50-100章"}
}
```

#### gene-战斗描写-001.json - 战斗描写技法
```json
{
  "rhythm": ["起:对手轻敌", "承:主角反击", "转:险象环生", "合:一击制胜"]
}
```

#### gene-感情互动-001.json - 感情互动描写
```json
{
  "phases": ["初识", "暗生情愫"],
  "techniques": ["借物喻情", "肢体语言", "反差萌"]
}
```

#### gene-心理活动-001.json - 心理活动描写
```json
{
  "patterns": ["危机时刻", "抉择时刻"],
  "principles": ["简洁有力", "用动作替代描写"]
}
```

### 3.2 耳根系列

#### gene-ergen-torment-001.json - 虐心情感描写
```json
{
  "patterns": ["求而不得", "生死离别", "执着癫狂"],
  "techniques": ["以乐景写哀情", "命运捉弄", "沉默式悲伤"]
}
```

#### gene-ergen-daoheart-001.json - 道心考验描写
```json
{
  "phases": ["道心初立", "道心之危", "道心圆满"]
}
```

#### gene-ergen-sacrifice-001.json - 牺牲与救赎描写
```json
{
  "sacrifice_types": ["替死", "献祭", "等待"]
}
```

---