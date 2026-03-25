"""
语音合成模块
使用ElevenLabs进行语音合成
"""
import requests
from typing import Dict, Optional
from config import (
    ELEVENLABS_API_KEY, 
    ELEVENLABS_BASE_URL, 
    VOICE_LIBRARY, 
    EMOTION_PARAMS
)


class VoiceSynthesizer:
    """语音合成器"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or ELEVENLABS_API_KEY
        self.base_url = ELEVENLABS_BASE_URL
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    def synthesize(
        self, 
        text: str, 
        voice_id: str = None,
        emotion: str = "neutral",
        output_path: str = None
    ) -> bytes:
        """
        合成语音
        
        Args:
            text: 要转换的文本
            voice_id: 音色ID（可选，默认使用旁白音色）
            emotion: 情感类型
            output_path: 输出文件路径（可选）
            
        Returns:
            音频数据（bytes）
        """
        # 确定音色
        if voice_id is None:
            voice_id = VOICE_LIBRARY["narrator"]["elevenlabs_id"]
        
        # 获取情感参数
        emotion_params = EMOTION_PARAMS.get(emotion, EMOTION_PARAMS["neutral"])
        
        # 构建请求
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.5,
                "use_speaker_boost": True,
                "speed": emotion_params.get("speed", 1.0),
                "pitch": emotion_params.get("pitch", 0)
            }
        }
        
        response = requests.post(url, headers=self.headers, json=data, timeout=60)
        response.raise_for_status()
        
        audio_data = response.content
        
        # 保存文件
        if output_path:
            with open(output_path, "wb") as f:
                f.write(audio_data)
            print(f"音频已保存到: {output_path}")
        
        return audio_data
    
    def synthesize_with_voice_name(
        self,
        text: str,
        voice_name: str,
        emotion: str = "neutral",
        output_path: str = None
    ) -> bytes:
        """
        使用音色名称合成语音
        
        Args:
            text: 要转换的文本
            voice_name: 音色名称（如 "young_male"）
            emotion: 情感类型
            output_path: 输出文件路径
            
        Returns:
            音频数据
        """
        voice_config = VOICE_LIBRARY.get(voice_name)
        if not voice_config:
            raise ValueError(f"未知的音色名称: {voice_name}")
        
        return self.synthesize(
            text=text,
            voice_id=voice_config["elevenlabs_id"],
            emotion=emotion,
            output_path=output_path
        )
    
    def list_voices(self) -> list:
        """获取可用音色列表"""
        url = f"{self.base_url}/voices"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        voices = response.json().get("voices", [])
        return [
            {
                "voice_id": v["voice_id"],
                "name": v["name"],
                "category": v.get("category", "unknown")
            }
            for v in voices
        ]
    
    def get_voice_library(self) -> Dict:
        """获取内置音色库"""
        return VOICE_LIBRARY
    
    def get_emotion_params(self) -> Dict:
        """获取情感参数配置"""
        return EMOTION_PARAMS