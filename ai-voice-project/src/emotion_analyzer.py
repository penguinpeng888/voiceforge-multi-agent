"""
情感识别模块
使用MiniMax LLM分析文本情感
"""
import json
import requests
from typing import Dict, List, Optional
from config import MINIMAX_API_KEY, MINIMAX_BASE_URL


class EmotionAnalyzer:
    """情感分析器"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or MINIMAX_API_KEY
        self.base_url = MINIMAX_BASE_URL
    
    def analyze(self, text: str) -> Dict:
        """
        分析文本情感
        
        Args:
            text: 待分析文本
            
        Returns:
            情感分析结果字典
        """
        prompt = self._build_prompt(text)
        response = self._call_llm(prompt)
        return self._parse_response(response)
    
    def _build_prompt(self, text: str) -> str:
        """构建分析提示词"""
        return f"""你是一个专业的情感分析专家。请分析以下小说片段的情感特征。

要求输出JSON格式：
{{
    "emotion": "主要情感类型(happy/sad/angry/fear/surprise/neutral/romance/battle)",
    "emotion_intensity": 0-1的情绪强度,
    "scene_type": "场景类型(indoor/outdoor/battle/romance/peaceful/mysterious/grand)",
    "characters": [
        {{"name": "角色名", "emotion": "角色情绪", "role": "角色定位(主角/配角/反派/路人)"}}
    ],
    "background_music": "建议的背景音乐类型",
    "sound_effects": ["建议的音效列表"],
    "narrative_type": "叙述类型(对话/独白/旁白/描写)"
}}

小说片段：
{text}

请直接输出JSON，不要其他内容。"""
    
    def _call_llm(self, prompt: str) -> str:
        """调用LLM API"""
        url = f"{self.base_url}/text/chatcompletion_v2"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "MiniMax-Text-01",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    def _parse_response(self, response: str) -> Dict:
        """解析LLM响应"""
        try:
            # 尝试提取JSON
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        
        # 解析失败返回默认值
        return {
            "emotion": "neutral",
            "emotion_intensity": 0.5,
            "scene_type": "indoor",
            "characters": [],
            "background_music": "平和音乐",
            "sound_effects": [],
            "narrative_type": "描写"
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict]:
        """
        批量分析文本
        
        Args:
            texts: 文本列表
            
        Returns:
            情感分析结果列表
        """
        results = []
        for text in texts:
            try:
                result = self.analyze(text)
                results.append(result)
            except Exception as e:
                print(f"分析失败: {e}")
                results.append({
                    "emotion": "neutral",
                    "emotion_intensity": 0.5,
                    "scene_type": "indoor",
                    "error": str(e)
                })
        return results