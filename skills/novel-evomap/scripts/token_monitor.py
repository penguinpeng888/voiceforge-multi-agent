#!/usr/bin/env python3
"""
Token 使用监控器
当上下文使用率达到阈值时发送提醒

用法:
    python token_monitor.py check --threshold 90
    python token_monitor.py setup-cron --threshold 90
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime

# 配置文件
CONFIG_FILE = Path("/root/.openclaw/workspace/.token-monitor-config.json")
LOG_FILE = Path("/root/.openclaw/workspace/.token-monitor.log")
ALERT_THRESHOLD = 90  # 默认90%


def get_session_status() -> dict:
    """获取当前会话状态"""
    import subprocess
    cmd = ["openclaw", "session", "status", "--json"]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception as e:
        print(f"❌ 获取状态失败: {e}")
    
    return {}


def parse_status(output: str) -> dict:
    """解析 status 输出"""
    result = {
        "input_tokens": 0,
        "output_tokens": 0,
        "context_used": 0,
        "context_total": 200000,
        "context_percent": 0
    }
    
    # 解析 Tokens 行
    tokens_match = output.find("Tokens:")
    if tokens_match != -1:
        line = output[tokens_match:output.find("\n", tokens_match)]
        parts = line.split()
        if "in" in parts and "/" in line:
            in_idx = parts.index("in")
            result["input_tokens"] = int(parts[in_idx+1].replace(",", ""))
            result["output_tokens"] = int(parts[in_idx+3].replace(",", ""))
    
    # 解析 Context 行
    context_match = output.find("Context:")
    if context_match != -1:
        line = output[context_match:output.find("\n", context_match)]
        if "/" in line and "%" in line:
            parts = line.replace("(", " ").replace(")", " ").replace("%", " ").split()
            result["context_percent"] = float(parts[-1])
            if "/" in line:
                frac = line.split("/")[1].split()[0]
                result["context_total"] = int(frac)
                result["context_used"] = int(parts[-2])
    
    return result


def check_token_usage(threshold: int = 90, verbose: bool = True) -> dict:
    """检查 Token 使用情况"""
    import subprocess
    cmd = ["openclaw", "session", "status"]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            status = parse_status(result.stdout)
            percent = status.get("context_percent", 0)
            
            is_alert = percent >= threshold
            
            if verbose:
                print(f"\n📊 Token 使用情况")
                print("="*50)
                print(f"上下文: {status['context_used']:,} / {status['context_total']:,}")
                print(f"已用: {percent:.1f}%")
                print(f"输入 Token: {status['input_tokens']:,}")
                print(f"输出 Token: {status['output_tokens']:,}")
                
                if is_alert:
                    print(f"\n⚠️  警告: 已达 {percent:.1f}%，超过 {threshold}% 阈值！")
                    print("建议: 尽快保存工作，可能需要 compact 或新会话")
                else:
                    remaining = 100 - percent
                    print(f"\n✅ 安全: 还剩 {remaining:.1f}% 空间")
                
                print(f"\n最后检查: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # 记录日志
            log_result(is_alert, percent, threshold)
            
            return {
                "alert": is_alert,
                "percent": percent,
                "threshold": threshold,
                "status": status
            }
    except Exception as ex:
        if verbose:
            print(f"❌ 检查失败: {ex}")
    
    return {"alert": False, "error": "failed to get status"}


def log_result(is_alert: bool, percent: float, threshold: int):
    """记录检查结果"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "alert": is_alert,
        "percent": percent,
        "threshold": threshold
    }
    
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")


def setup_cron(threshold: int = 90):
    """设置定时检查"""
    import subprocess
    
    # 创建 cron 命令
    cmd = f'*/10 * * * * cd /root/.openclaw/workspace/skills/novel-evomap/scripts && python3 token_monitor.py check --threshold {threshold} --quiet'
    
    # 使用 openclaw cron 添加
    add_cmd = ["openclaw", "cron", "add", 
               "--name", "Token监控",
               "--schedule", "*/10 * * * *",
               "--command", f"cd /root/.openclaw/workspace/skills/novel-evomap/scripts && python3 token_monitor.py check --threshold {threshold}"]
    
    try:
        result = subprocess.run(add_cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Cron 已设置: 每10分钟检查一次，阈值 {threshold}%")
        else:
            print(f"⚠️  使用手动方式添加 cron")
            # 备选：打印手动命令
            print(f"手动添加 crontab:")
            print(cmd)
    except Exception as e:
        print(f"❌ 设置失败: {e}")


def alert_user(threshold: int = 90):
    """发送提醒给用户"""
    status = get_session_status()
    percent = status.get("context_percent", 0)
    
    if percent >= threshold:
        message = f"""
⚠️  **Token 使用警告**

上下文使用已达 **{percent:.1f}%**（超过 {threshold}% 阈值）

建议操作:
1. 尽快保存当前工作
2. 考虑 compact 上下文
3. 或准备开启新会话继续工作

当前会话: OpenClaw
"""
        print(message)
        return True
    
    return False


# ============================================================
# 主程序
# ============================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Token 使用监控器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s check                         # 检查当前使用情况
    %(prog)s check --threshold 85          # 设置85%阈值
    %(prog)s setup-cron --threshold 90     # 设置自动检查cron
        """
    )
    
    parser.add_argument("command", choices=["check", "setup-cron"], help="命令")
    parser.add_argument("--threshold", "-t", type=int, default=90, help="警告阈值")
    parser.add_argument("--quiet", "-q", action="store_true", help="安静模式")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    if args.command == "check":
        check_token_usage(threshold=args.threshold, verbose=not args.quiet)
        
        if not args.quiet:
            # 建议用户添加到 MEMORY.md
            print("\n" + "="*50)
            print("💡 提示: 将以下内容加入 MEMORY.md 启动检查:")
            print(f"   每次会话启动时运行: python evomap_cli.py token check")
            print(f"   阈值设置: {args.threshold}%")
    
    elif args.command == "setup-cron":
        setup_cron(threshold=args.threshold)


if __name__ == "__main__":
    main()
