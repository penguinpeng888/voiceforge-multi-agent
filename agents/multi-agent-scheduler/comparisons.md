# 多Agent任务调度器 - 五家LLM对比

## 参赛选手

| LLM | 特色 | 代码行数 |
|-----|------|----------|
| **Claude** | 最完整（优先级+超时+回调+架构图+设计决策） | ~200行 |
| **MiniMax** | 和Claude版几乎相同 | ~200行 |
| **glm5** | Task内嵌Event，最简洁 | ~100行 |
| **DeepSeek** | 去掉花哨，核心清晰 | ~120行 |
| **千问** | 一看就懂，入门首选 | ~80行 |

## 核心架构

```
用户 → MasterAgent → PriorityQueue ← Worker-1
                              ← Worker-2
                              ← Worker-N
```

## 核心概念

1. **Master-Worker架构** — Master分发任务，Worker执行
2. **Pull模型** — Worker自己从队列取，比Push更高效，避免Master成为瓶颈
3. **优先级队列** — `queue.PriorityQueue`，数字越小越先出队
4. **线程同步** — `threading.Lock` + `threading.Event`
5. **超时处理** — 子线程 `join(timeout)`

## 关键代码片段

### 优先级队列
```python
class Priority(IntEnum):
    HIGH = 1
    NORMAL = 2
    LOW = 3

# 入队 (priority小 = 先出)
task_queue.put((task.priority, task))
```

### 超时处理
```python
worker_thread = threading.Thread(target=_work)
worker_thread.start()
worker_thread.join(timeout=task.timeout)
if worker_thread.is_alive():
    # 超时
    task.status = "failed"
```

### 回调机制
```python
if task.callback:
    task.callback(task)
```

## 推荐版本

| 场景 | 推荐 |
|------|------|
| 面试/学习原理 | 千问版 → DeepSeek版 |
| 生产项目 | Claude/MiniMax版 |
| 快速集成 | glm5版 |

## 设计决策总结（来自Claude）

| 问题 | 选择 | 原因 |
|------|------|------|
| 任务分发模型 | Pull（Worker主动取） | 避免Master成为瓶颈，天然负载均衡 |
| 优先级队列 | queue.PriorityQueue | 线程安全 |
| 超时实现 | 子线程 + join(timeout) | 不杀进程，Worker不阻塞 |
| 结果同步 | threading.Event per task | wait_for(task_id) 精确等待 |
| 全部完成 | queue.join() | 基于task_done()计数，零轮询 |

---
整理时间: 2026-03-27