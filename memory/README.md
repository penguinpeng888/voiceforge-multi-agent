# OpenClaw 记忆系统 (MemU-Style)

## 目录结构

```
memory/
├── preferences/          # 用户偏好和设置
│   └── user.md           # 用户信息
├── relationships/        # 人物关系
│   └── contacts/         # 联系人
├── knowledge/           # 知识库
│   ├── novel/            # 小说创作
│   └── skills/           # 技能
├── context/             # 当前上下文
│   └── active_tasks.md  # 进行中的任务
├── projects/            # 项目
│   ├── novel-writing/
│   └── music-creation/
└── daily/               # 每日记录
    └── YYYY-MM-DD.md
```

## 使用流程

1. 读取 preferences/user.md → 了解当前任务
2. 读取 context/active_tasks.md → 继续未完成任务
3. 读取 daily/ 最新日期 → 了解最新进展