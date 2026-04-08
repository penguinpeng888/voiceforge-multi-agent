#!/usr/bin/env python3
"""
OpenClaw 健康检查 - 每次启动时验证
"""

import json
import sys
from pathlib import Path

HOME = Path.home()
OPENCLAW_DIR = HOME / ".openclaw"

def check_file(path, name, critical=False):
    """检查文件是否存在"""
    if path.exists():
        print(f"✅ {name}")
        return True
    else:
        if critical:
            print(f"❌ {name} - 关键文件缺失!")
            return False
        else:
            print(f"⚠️ {name} - 不存在（可选）")
            return True

def check_integration():
    """检查集成状态"""
    print("\n=== 集成状态 ===")
    
    status_file = OPENCLAW_DIR / "integration-status.json"
    if not status_file.exists():
        print("⚠️ 未配置集成，使用默认设置")
        return True
    
    with open(status_file) as f:
        status = json.load(f)
    
    for name, config in status.get("integrations", {}).items():
        enabled = config.get("enabled", False)
        mode = config.get("mode", "unknown")
        status_str = "✅" if enabled else "❌"
        print(f"  {status_str} {name}: {mode}")
    
    return True

def main():
    print("OpenClaw 健康检查")
    print("=" * 40)
    
    # 检查关键文件
    checks = [
        (OPENCLAW_DIR / "workspace" / "SOUL.md", "SOUL.md", True),
        (OPENCLAW_DIR / "workspace" / "USER.md", "USER.md", True),
        (OPENCLAW_DIR / "skills", "Skills 目录", False),
        (OPENCLAW_DIR / "user-profile.json", "用户画像", False),
        (OPENCLAW_DIR / "memory-index.json", "记忆索引", False),
    ]
    
    all_ok = True
    for path, name, critical in checks:
        if not check_file(path, name, critical):
            all_ok = False
    
    check_integration()
    
    print("\n" + "=" * 40)
    if all_ok:
        print("✅ 系统状态正常")
        return 0
    else:
        print("⚠️ 某些检查失败，但不影响运行")
        return 0  # 仍返回成功，不阻止启动

if __name__ == "__main__":
    sys.exit(main())
