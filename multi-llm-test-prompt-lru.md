# 多AI编程协作测试 - 第6轮

## 任务：实现LRU缓存淘汰算法

### 题目描述

设计一个 **LRU（最近最少使用）缓存淘汰算法**。

### 功能要求

1. **初始化**: 创建一个指定容量的LRU缓存
2. **获取数据**: `get(key)` - 如果存在返回value，否则返回-1
3. **写入数据**: `put(key, value)` - 写入key-value，如果key已存在更新value；如果缓存满，淘汰最久未使用的key
4. **淘汰机制**: 当容量满时，淘汰最久未访问（get或put）的key-value对

### 示例

```python
# 创建容量为2的缓存
cache = LRUCache(2)

cache.put(1, 1)    # 缓存: {1:1}
cache.put(2, 2)    # 缓存: {1:1, 2:2}
cache.get(1)       # 返回1，缓存: {2:2, 1:1} (1被移到最新)
cache.put(3, 3)    # 缓存满，淘汰key=2，缓存: {1:1, 3:3}
cache.get(2)       # 返回-1 (key=2已被淘汰)
cache.put(4, 4)    # 缓存满，淘汰key=1，缓存: {3:3, 4:4}
cache.get(1)       # 返回-1
cache.get(3)       # 返回3
cache.get(4)       # 返回4
```

### 约束条件

| 约束项 | 要求 |
|--------|------|
| **编程语言** | Python 3.10+ |
| **文件结构** | 单文件，仅一个.py文件 |
| **依赖** | 仅标准库，禁止pip安装第三方包 |
| **输入方式** | 函数参数输入，禁止input() |
| **输出方式** | return返回值，禁止print() |
| **测试框架** | 不使用pytest/unittest，用纯断言 |
| **类名** | 必须为 `LRUCache` |
| **方法** | 必须有 `get(self, key)` 和 `put(self, key, value)` |

### 输出格式

```python
class LRUCache:
    def __init__(self, capacity: int):
        """初始化缓存容量"""
        pass
    
    def get(self, key: int) -> int:
        """获取缓存，如果不存在返回-1"""
        pass
    
    def put(self, key: int, value: int) -> None:
        """写入缓存，容量满时淘汰最久未使用的"""
        pass

# 测试用例
def test_basic():
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1
    
# 更多测试...
```

### 测试要求

1. **至少10个测试用例**，覆盖：
   - 基本读写
   - 容量满淘汰
   - 访问后更新顺序
   - 重复key更新
   - 边界（容量=1）
   - 错误处理

2. **每个测试用例独立**，用assert断言

3. **中文注释**说明测试目的

请开始编写代码和测试用例。