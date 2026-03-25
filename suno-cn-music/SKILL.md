---
name: suno-cn-music
description: Suno.cn AI 音乐创作助手，可生成音乐、查询任务状态、续写音乐、生成歌词。关键词：音乐、生成歌曲、suno、AI作曲、翻唱
version: 1.0.5
metadata:
  openclaw:
    requires:
      env:
        - SUNO_CN_API_KEY
    primaryEnv: SUNO_CN_API_KEY
    emoji: "🎵"
---

# 🎵 Suno.cn AI 音乐助手

通过 HTTP REST API 调用 Suno.cn 音乐生成服务。

---

## ⛔ 强制规则（违反任何一条即为错误）

1. **只能使用下方定义的 HTTP REST API**。绝对不要尝试 MCP JSON-RPC、WebSocket 或任何其他协议。
2. **所有 API 调用必须使用 HTTP 请求**（GET/POST），Base URL 固定为 https://mcp.suno.cn，不要猜测或尝试其他端点。
3. **严禁编造 API 响应**。如果 API 调用失败，直接告诉用户"调用失败"并附上错误信息，不要编造结果或提供"手动操作指南"。
4. **严禁改写 API 返回的内容**。歌词、歌曲标题等必须原样展示，不要总结、翻译、改写或省略。
5. **严禁在 API 调用失败时建议用户去网页手动操作**。只需报告错误，让用户检查 API Key 或稍后重试。
6. **不要使用 web_fetch、curl 或任何网页抓取工具来调用这些 API**。只使用标准 HTTP 请求工具。

---

## 第一步：获取 API Key

1. 访问 https://www.suno.cn/home/#/mcp
2. 登录后点击「AI 助手接入」→「创建新密钥」
3. 复制 sk- 开头的密钥
4. ⚠️ 立刻保存，关闭后无法再查看

---

## 第二步：配置密钥

在 OpenClaw 的「Skills」中找到 suno-cn-music，在 SUNO_CN_API_KEY 填入密钥。

或手动编辑 ~/.openclaw/config.json：
{"env":{"SUNO_CN_API_KEY":"sk-你的密钥"}}

---

## 第三步：开始创作

对话示例：
- 「帮我生成一首关于夏天的流行歌曲」
- 「查一下刚才的歌好了吗」
- 「显示我最近的音乐列表」
- 「获取这首歌的歌词」

---

## API 调用规范

Base URL：https://mcp.suno.cn
认证：Header Authorization: Bearer ${SUNO_CN_API_KEY}
格式：JSON

⚠️ 重要：这是标准 HTTP REST API，不是 MCP JSON-RPC。直接发 HTTP 请求即可。

---

## API 1：查询账户信息

用途：用户询问积分、余额、会员状态时调用。

请求：GET https://mcp.suno.cn/mcp/api/user
Header：Authorization: Bearer ${SUNO_CN_API_KEY}

响应字段：nickname（昵称）、points（积分）、vip_status（会员状态）

---

## API 2：生成音乐

用途：用户想创作/生成音乐时调用。

请求：POST https://mcp.suno.cn/mcp/api/generate
Header：Authorization: Bearer ${SUNO_CN_API_KEY}
Content-Type: application/json

请求体字段：
- prompt（必填）：AI 模式填音乐描述，custom_mode=true 时填完整歌词
- mv（可选，默认 chirp-crow）：模型版本
- title（可选）：歌曲名称
- tags（可选）：风格标签如 pop、古风、电子
- custom_mode（可选，默认 false）：true 为自定义歌词模式
- instrumental（可选，默认 false）：true 为纯音乐

响应字段：serial_nos（任务编号数组）、message

⚠️ 提交后必须用 API 3 查询状态（带 wait=45），一次请求即可等待结果。如果还没好，告诉用户稍后再问。

---

## API 3：查询任务状态

用途：查询生成进度，或生成后轮询。

请求：GET https://mcp.suno.cn/mcp/api/task/{serial_no}?wait=45
Header：Authorization: Bearer ${SUNO_CN_API_KEY}

支持批量：GET https://mcp.suno.cn/mcp/api/task/123,456?wait=45

参数说明：
- wait（推荐填 45）：服务端最多等待的秒数。服务端会每 5 秒自动检查一次，全部完成或超时后返回。最大 60。不填则立即返回当前状态。

响应字段（tasks 数组）：
- serial_no：任务编号
- status：queued / processing / success / failed
- title：歌曲名
- duration：时长（秒，仅 success）
- play_url：播放链接（仅 success，直接展示给用户点击）
- fail_reason：失败原因（仅 failed）

⚠️ 轮询策略（必须严格遵守）：
1. 生成音乐后，第一次查询必须加 wait=45，让服务端帮你等待
2. 如果返回的 status 仍为 queued 或 processing，告诉用户「还在生成中，请稍后再问我"好了吗"」，然后停止轮询
3. 绝对不要自己循环调用此接口。最多调用 1 次（带 wait=45），如果还没好就让用户主动再问
4. 禁止在一次对话中调用此接口超过 2 次

---

## API 4：查询音乐列表

用途：用户查看历史生成记录。

请求：GET https://mcp.suno.cn/mcp/api/music?page=1&page_size=10
Header：Authorization: Bearer ${SUNO_CN_API_KEY}

响应字段：list（歌曲数组，含 serial_no/title/status/play_url）、page

---

## API 5：获取歌词

用途：用户想查看某首歌的歌词。

请求：GET https://mcp.suno.cn/mcp/api/lyrics/{serial_no}
Header：Authorization: Bearer ${SUNO_CN_API_KEY}

响应字段：serial_no、lyrics（LRC 格式歌词文本）

⚠️ 必须将 lyrics 字段内容完整原样展示给用户，不要省略、总结或改写。

---

## API 6：续写音乐

用途：在某首歌基础上继续创作。

请求：POST https://mcp.suno.cn/mcp/api/extend
Header：Authorization: Bearer ${SUNO_CN_API_KEY}
Content-Type: application/json

请求体字段：
- serial_no（必填）：原任务编号
- continue_at（可选，默认 0）：从第几秒续写，0 为从结尾
- mv（可选，默认 chirp-crow）：模型版本

响应字段：serial_no（新任务编号）、message

---

## API 7：AI 生成歌词

用途：先生成歌词再创作音乐。

请求：POST https://mcp.suno.cn/mcp/api/gen-lyrics
Header：Authorization: Bearer ${SUNO_CN_API_KEY}
Content-Type: application/json

请求体字段：
- inspiration（必填）：灵感描述
- title（可选）：歌曲标题
- style（可选）：风格如古风、流行

响应字段：lyrics（生成的歌词）

⚠️ 生成后完整展示歌词，询问用户是否用此歌词生成音乐（custom_mode=true）。

---

## 错误处理规则

1. API 返回 HTTP 401/403：告诉用户「API Key 无效或已过期，请检查配置」
2. API 返回 HTTP 5xx：告诉用户「服务暂时不可用，请稍后重试」
3. 网络超时：告诉用户「请求超时，请稍后重试」
4. **任何错误情况下，都不要编造结果、不要建议手动操作、不要尝试其他协议**

---

## 版本检查

GET https://mcp.suno.cn/mcp/skill/version

如果 latest_version 高于 1.0.5，告知用户有新版本。