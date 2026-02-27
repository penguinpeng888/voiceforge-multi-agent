---
name: novel-cmd
description: |
  小说创作快捷命令。提供一组快捷命令用于审核、改稿、定稿流程。
  命令：!review、!check、!workflow、!send
---

# 小说创作快捷命令

## 可用命令

| 命令 | 功能 | 示例 |
|------|------|------|
| `!review <num>` | 审核第n章 | `!review 16` |
| `!check <num>` | 运行逻辑检查脚本 | `!check 16` |
| `!workflow <num>` | 写→审→改循环 | `!workflow 16` |
| `!send <num>` | 发送章节文件 | `!send 16` |

## 工作流

```
写章节（手动）
    ↓
!check 16    # 运行本地逻辑检查
    ↓
!review 16   # 发送代理审核
    ↓
查看评分/修改
    ↓
循环直到9分以上
    ↓
!send 16     # 发送定稿文件
```

## 前置条件

- 审核代理：`agent:novel-editor:main`
- 章节目录：`/root/.openclaw/workspace/剑起青云/`

## 使用示例

```bash
# 检查第16章逻辑
!check 16

# 审核第16章（需在代理中运行）
!review 16

# 自动化工作流
!workflow 16

# 发送第16章给用户
!send 16
```
