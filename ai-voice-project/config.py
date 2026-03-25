"""
AI配音项目配置
"""
import os
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent

# API配置
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimax.chat/v1"

# ElevenLabs配置
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

# 音色库配置
VOICE_LIBRARY = {
    " narrator": {
        "elevenlabs_id": "pNInz6obpgDQGcFmaJgB",  # Adam
        "description": "中性旁白"
    },
    "young_male": {
        "elevenlabs_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel
        "description": "年轻男性"
    },
    "young_female": {
        "elevenlabs_id": "EXAVITQu4vr4xnSDxMaL",  # Sarah
        "description": "年轻女性"
    },
    "elder_male": {
        "elevenlabs_id": "AZnzlk1XvdvUeBnObpgQ",  # Arnold
        "description": "老年男性"
    },
    "warrior": {
        "elevenlabs_id": "JBFqnCBsd6RMkjVDRGzb",  # Clyde
        "description": "战士/硬汉"
    },
    "immortal": {
        "elevenlabs_id": "o0t6HmTv7wKjOdNuWj6E",  # Ethan
        "description": "仙人/飘逸"
    }
}

# 情感参数映射
EMOTION_PARAMS = {
    "happy": {"speed": 1.1, "pitch": 0},
    "sad": {"speed": 0.9, "pitch": -1},
    "angry": {"speed": 1.2, "pitch": 1},
    "fear": {"speed": 1.15, "pitch": 0.5},
    "neutral": {"speed": 1.0, "pitch": 0},
    "surprise": {"speed": 1.05, "pitch": 0.3},
    "romance": {"speed": 0.95, "pitch": -0.5},
    "battle": {"speed": 1.3, "pitch": 0.8},
    "calm": {"speed": 0.9, "pitch": -0.3},
    "tension": {"speed": 1.1, "pitch": 0.2}
}

# 场景音乐映射
SCENE_MUSIC = {
    "battle": "战斗音乐-紧张激烈",
    "romance": "爱情音乐-轻柔舒缓",
    "sad": "悲伤音乐-低沉忧伤",
    "peaceful": "平和音乐-宁静悠然",
    "mysterious": "神秘音乐-诡异多变",
    "grand": "宏大音乐-史诗震撼",
    "indoor": "室内音乐-温馨柔和",
    "outdoor": "户外音乐-自然空旷"
}

# 输出配置
OUTPUT_DIR = PROJECT_ROOT / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# 日志配置
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")