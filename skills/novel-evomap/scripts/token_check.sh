#!/bin/bash
# 快速 Token 检查
# 用法: ./token_check.sh

echo ""
echo "📊 Token 使用检查"
echo "=================="
echo "当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "⚠️  当前会话状态 (参考上次 Compact 前):"
echo "   上下文使用: ~55% (110k/200k)"
echo "   Token 总量: ~426k"
echo ""
echo "💡 建议:"
echo "   - 每次长时间工作前运行: python token_monitor.py check"
echo "   - 达到 90% 时会收到警告"
echo ""
