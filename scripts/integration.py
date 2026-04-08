#!/usr/bin/env python3
"""
OpenClaw 轻量级集成模块
功能：在后台观察和索引，不影响主系统
"""

import json
import os
from pathlib import Path
from datetime import datetime

# 路径配置
HOME = Path.home()
PROFILE_FILE = HOME / ".openclaw" / "user-profile.json"
INDEX_FILE = HOME / ".openclaw" / "memory-index.json"
STATUS_FILE = HOME / ".openclaw" / "integration-status.json"

def load_status():
    """加载集成状态"""
    if STATUS_FILE.exists():
        with open(STATUS_FILE) as f:
            return json.load(f)
    return {"integrations": {}}

def save_json(path, data):
    """安全保存 JSON"""
    temp = str(path) + ".tmp"
    with open(temp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(temp, path)

# ============ 用户画像（被动观察）===========
def observe_user_interaction(user_message, agent_response):
    """观察用户交互，提取偏好（不改变回复）"""
    status = load_status()
    if not status.get("integrations", {}).get("user_profiler", {}).get("enabled", True):
        return
    
    if not PROFILE_FILE.exists():
        return
    
    try:
        with open(PROFILE_FILE) as f:
            profile = json.load(f)
        
        observations = profile.get("observations", {})
        
        # 简单观察：消息长度、活跃时间
        now = datetime.now().isoformat()
        
        # 更新统计
        if "statistics" not in profile:
            profile["statistics"] = {"messages": 0}
        profile["statistics"]["messages"] = profile["statistics"].get("messages", 0) + 1
        profile["updated_at"] = now
        
        save_json(PROFILE_FILE, profile)
    except Exception:
        pass  # 静默失败，不影响主系统

# ============ 记忆索引（被动）===========
def index_memory(user_message, session_context):
    """索引关键信息（不改变回复）"""
    status = load_status()
    if not status.get("integrations", {}).get("cross_session_memory", {}).get("enabled", True):
        return
    
    if not INDEX_FILE.exists():
        return
    
    try:
        with open(INDEX_FILE) as f:
            index = json.load(f)
        
        # 简单索引：提取关键词
        keywords = ["skill", "小说", "AI", "music", "股票", "harness"]
        found = [k for k in keywords if k in user_message.lower()]
        
        now = datetime.now().strftime("%Y-%m-%d")
        
        for kw in found:
            if kw not in index.get("keywords", {}):
                index.setdefault("keywords", {})
            index["keywords"].setdefault(kw, [])
            if now not in index["keywords"][kw]:
                index["keywords"][kw].append(now)
        
        index["updated"] = now
        save_json(INDEX_FILE, index)
    except Exception:
        pass  # 静默失败

# ============ 触发检测（供主系统调用）===========
def check_triggers(message):
    """检查消息是否触发某些功能"""
    status = load_status()
    triggers = []
    
    # Auto Skill Evolve 触发
    evolve_keywords = ["创建 skill", "训练技能", "make skill", "train skill", "evolve"]
    if any(k in message.lower() for k in evolve_keywords):
        if status.get("integrations", {}).get("auto_skill_evolve", {}).get("enabled", True):
            triggers.append("auto_skill_evolve")
    
    # Voice Mode 触发
    voice_keywords = ["语音", "voice", "说话", "tts"]
    if any(k in message.lower() for k in voice_keywords):
        if status.get("integrations", {}).get("voice_mode", {}).get("enabled", False):
            triggers.append("voice_mode")
    
    return triggers

if __name__ == "__main__":
    print("OpenClaw 轻量集成模块")
    print(f"用户画像: {PROFILE_FILE}")
    print(f"记忆索引: {INDEX_FILE}")
    print(f"状态文件: {STATUS_FILE}")
