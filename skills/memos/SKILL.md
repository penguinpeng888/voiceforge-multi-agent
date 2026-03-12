---
name: memos
description: |
  MemOS - AI记忆操作系统。用于LLM和AI Agent的长期记忆管理，
  支持存储/检索/管理长期记忆，支持KB、多模态、工具记忆和企业级优化。
  支持Cloud和Local两种部署模式。
---

# MemOS 技能

## 什么是 MemOS

MemOS 是一个 AI 记忆操作系统，为 LLM 和 AI Agent 提供统一的**存储/检索/管理**长期记忆能力。

## 核心功能

- **统一记忆API**: 存储、检索、编辑、删除记忆
- **多模态记忆**: 支持文本、图像、工具轨迹、人设
- **知识库管理**: 多项目知识库隔离/共享
- **记忆反馈修正**: 用自然语言修正记忆
- **节省tokens**: 比加载完整对话历史节省35%

## 使用方式

### 1. Cloud API (推荐)

```python
import requests
import json

# 添加记忆
data = {
    "user_id": "你的用户ID",
    "mem_cube_id": "知识库ID",
    "messages": [{"role": "user", "content": "要记忆的内容"}],
    "async_mode": "sync"
}
headers = {"Content-Type": "application/json"}
url = "http://localhost:8000/product/add"  # 替换为实际API地址
res = requests.post(url=url, headers=headers, data=json.dumps(data))

# 搜索记忆
data = {
    "query": "搜索内容",
    "user_id": "你的用户ID",
    "mem_cube_id": "知识库ID"
}
url = "http://localhost:8000/product/search"
res = requests.post(url=url, headers=headers, data=json.dumps(data))
```

### 2. Local 自托管

```bash
# 克隆项目
git clone https://github.com/MemTensor/MemOS.git
cd MemOS
pip install -r ./docker/requirements.txt

# 配置环境变量
cp docker/.env.example MemOS/.env
# 填写 OPENAI_API_KEY 等

# 启动服务
cd docker
docker compose up
```

## 获取API Key

1. 访问 [MemOS Dashboard](https://memos-dashboard.openmem.net/)
2. 注册账号
3. 获取API Key

## OpenClaw 集成

MemOS 已有官方 OpenClaw 插件：

- **Cloud插件**: https://github.com/MemTensor/MemOS-Cloud-OpenClaw-Plugin
- **Local插件**: https://github.com/MemTensor/MemOS-Local-OpenClaw-Plugin

## 常用场景

- 跨会话记忆共享
- 个性化对话
- 知识库问答
- Agent任务规划

## 文档

- [官方文档](https://memos-docs.openmem.net/)
- [GitHub](https://github.com/MemTensor/MemOS)