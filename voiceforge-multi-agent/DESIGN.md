# VoiceForge - AI 配音系统设计规范

基于 Linear + Claude 风格

## 1. Visual Theme & Atmosphere

**氛围**：专业、深色、极简、开发者友好

**设计哲学**：
- 减少视觉噪音，聚焦内容
- 精确的间距和层次
- 暗色主题为主，护眼
- 功能导向，简洁至上

**密度**：中等偏低，留白充足

## 2. Color Palette & Roles

### 主色
| 颜色名称 | Hex | 用途 |
|----------|-----|------|
| **Background** | `#0D0D0F` | 主背景，深黑 |
| **Surface** | `#16161A` | 卡片、面板 |
| **Surface Elevated** | `#1E1E24` | 悬停态、弹窗 |
| **Border** | `#2A2A30` | 分割线、边框 |

### 强调色
| 颜色名称 | Hex | 用途 |
|----------|-----|------|
| **Primary** | `#8B5CF6` | 主按钮、链接（紫色） |
| **Primary Hover** | `#A78BFA` | 主按钮悬停 |
| **Success** | `#10B981` | 成功状态 |
| **Warning** | `#F59E0B` | 警告状态 |
| **Error** | `#EF4444` | 错误状态 |

### 文本色
| 颜色名称 | Hex | 用途 |
|----------|-----|------|
| **Text Primary** | `#EDEDEF` | 主标题、 正文 |
| **Text Secondary** | `#A1A1AA` | 次要信息、占位符 |
| **Text Muted** | `#71717A` | 禁用状态 |

## 3. Typography Rules

### 字体
- **标题**：`"Geist", "SF Pro Display", -apple-system, sans-serif`
- **正文**：`"Geist", "SF Pro Text", -apple-system, sans-serif`
- **代码**：`"Geist Mono", "SF Mono", monospace`

### 字号层级
| 级别 | 字号 | 行高 | 字重 |
|------|------|------|------|
| H1 | 28px | 1.3 | 600 |
| H2 | 22px | 1.3 | 600 |
| H3 | 18px | 1.4 | 600 |
| Body | 14px | 1.5 | 400 |
| Small | 12px | 1.4 | 400 |
| Caption | 11px | 1.3 | 500 |

## 4. Component Stylings

### 按钮
```css
/* Primary */
background: #8B5CF6;
color: white;
border-radius: 6px;
padding: 8px 16px;
font-weight: 500;
transition: all 0.15s ease;

/* Primary Hover */
background: #A78BFA;
transform: translateY(-1px);

/* Secondary */
background: transparent;
border: 1px solid #2A2A30;
color: #EDEDEF;

/* Ghost */
background: transparent;
color: #A1A1AA;
```

### 输入框
```css
background: #16161A;
border: 1px solid #2A2A30;
border-radius: 6px;
padding: 10px 12px;
color: #EDEDEF;
transition: border-color 0.15s ease;

focus: border-color: #8B5CF6;
```

### 卡片
```css
background: #16161A;
border: 1px solid #2A2A30;
border-radius: 8px;
padding: 16px;
```

### 标签/Tag
```css
background: #1E1E24;
color: #A1A1AA;
border-radius: 4px;
padding: 4px 8px;
font-size: 12px;
```

## 5. Layout Principles

### 间距系统
| 名称 | 像素 |
|------|------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 48px |

### 布局规则
- 最大内容宽度：1200px
- 侧边距：24px（移动端 16px）
- 卡片间距：16px
- 组件内间距：12-16px

## 6. Depth & Elevation

### 阴影
```css
/* 卡片 */
box-shadow: 0 1px 3px rgba(0,0,0,0.3);

/* 弹窗 */
box-shadow: 0 8px 32px rgba(0,0,0,0.4);
```

### 层级
- 背景：z-0
- 卡片：z-10
- 悬停：z-20
- 弹窗：z-50
- Toast：z-100

## 7. Do's and Don'ts

### ✅ Do
- 使用紫色作为唯一强调色
- 保持一致的间距
- 暗色背景优先
- 圆角统一 6-8px

### ❌ Don't
- 不要使用多种强调色
- 避免纯白文字（用 #EDEDEF）
- 不要用太深的阴影
- 避免过多的层次

## 8. Responsive Behavior

### 断点
| 名称 | 宽度 |
|------|------|
| Mobile | < 640px |
| Tablet | 640px - 1024px |
| Desktop | > 1024px |

### 移动端
- 减小字号 1px
- 减少内边距
- 隐藏非核心功能
- 触控目标 ≥ 44px

## 9. Agent Prompt Guide

### 快速参考
```
主色: #8B5CF6 (紫)
背景: #0D0D0F
卡片: #16161A
文字: #EDEDEF
次要: #A1A1AA
```

### 可用提示词
```
"创建一个深色主题的按钮"
"添加一个输入框，紫色聚焦边框"
"使用 Linear 风格的项目卡片"
```

---

## 10. Multi-Agent TTS 系统

### 架构
```
输入长文本
    ↓
文本分片 → [Agent1] [Agent2] [Agent3] [Agent4] 并行
    ↓
各Agent调用海螺AI网页版生成音频
    ↓
ffmpeg 合并 → 最终音频
```

### 特性
- **并行处理**：4个Agent同时处理，速度提升4倍
- **无需API**：直接调用海螺AI网页版
- **可扩展**：可以增加Agent数量来提速
- **自动合并**：ffmpeg 自动拼接音频片段

### 使用方法
```javascript
const { MultiAgentTTS } = require('./multi-agent-tts');

const tts = new MultiAgentTTS({
  numAgents: 4,        // 并行Agent数量
  tempDir: './temp-tts'
});

const result = await tts.synthesize('要转换的长文本...', {
  output: './output.mp3'
});

console.log(result);
```

### 文件
- `multi-agent-tts.js` - 核心实现
- 依赖：playwright, ffmpeg
