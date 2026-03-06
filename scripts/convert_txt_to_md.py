import re
import sys

# 读取原文件
with open('/root/.openclaw/workspace/novel/凡人修仙传.md', 'r', encoding='utf-8') as f:
    content = f.read()

# 用正则匹配章节标题并添加 # 号
# 匹配 "第X章 标题" 格式
content = re.sub(r'(^第[一二三四五六七八九十百千零〇]+章[ \t]+[^\n]+)', r'# \1', content, flags=re.MULTILINE)

# 保存
with open('/root/.openclaw/workspace/novel/凡人修仙传_md.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("转换完成！")

# 检查有多少章节
chapters = re.findall(r'^# 第[一二三四五六七八九十百千零〇]+章', content, re.MULTILINE)
print(f"发现 {len(chapters)} 个章节")
for c in chapters[:10]:
    print(c)