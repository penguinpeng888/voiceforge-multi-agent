#!/usr/bin/env python3
"""
MemOS Python Client
用于OpenClaw的MemOS集成
"""
import os
import requests
import json

class MemOS:
    def __init__(self, api_key=None, base_url="https://api.memos.openmem.net"):
        self.api_key = api_key or os.getenv("MEMOS_API_KEY")
        self.base_url = base_url
        if not self.api_key:
            raise ValueError("需要设置MEMOS_API_KEY")
    
    def add(self, user_id, content, mem_cube_id=None, async_mode="sync"):
        """添加记忆"""
        url = f"{self.base_url}/product/add"
        headers = {"Content-Type": "application/json"}
        data = {
            "user_id": user_id,
            "messages": [{"role": "user", "content": content}],
            "async_mode": async_mode
        }
        if mem_cube_id:
            data["mem_cube_id"] = mem_cube_id
        
        res = requests.post(url, headers=headers, json=data)
        return res.json()
    
    def search(self, query, user_id, mem_cube_id=None):
        """检索记忆"""
        url = f"{self.base_url}/product/search"
        headers = {"Content-Type": "application/json"}
        data = {
            "query": query,
            "user_id": user_id
        }
        if mem_cube_id:
            data["mem_cube_id"] = mem_cube_id
        
        res = requests.post(url, headers=headers, json=data)
        return res.json()
    
    def feedback(self, user_id, feedback, mem_cube_id=None):
        """记忆反馈修正"""
        url = f"{self.base_url}/product/feedback"
        headers = {"Content-Type": "application/json"}
        data = {
            "user_id": user_id,
            "feedback": feedback
        }
        if mem_cube_id:
            data["mem_cube_id"] = mem_cube_id
        
        res = requests.post(url, headers=headers, json=data)
        return res.json()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python memos_client.py <add|search> <content/query>")
        sys.exit(1)
    
    op = sys.argv[1]
    content = sys.argv[2]
    user_id = os.getenv("MEMOS_USER_ID", "default")
    
    memos = MemOS()
    
    if op == "add":
        result = memos.add(user_id, content)
    elif op == "search":
        result = memos.search(content, user_id)
    else:
        print(f"Unknown operation: {op}")
        sys.exit(1)
    
    print(json.dumps(result, indent=2, ensure_ascii=False))