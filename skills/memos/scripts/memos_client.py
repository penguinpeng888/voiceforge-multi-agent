#!/usr/bin/env python3
"""MemOS Simple Client"""
import os
import sys
import json
import requests
from typing import Optional, List, Dict

class MemOSClient:
    def __init__(self, api_key: str, base_url: str = "https://api.memtensor.com"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    
    def add_memory(self, content: str, user_id: str, mem_cube_id: str = "default") -> dict:
        url = f"{self.base_url}/product/add"
        data = {
            "user_id": user_id,
            "mem_cube_id": mem_cube_id,
            "messages": [{"role": "user", "content": content}],
            "async_mode": "sync"
        }
        resp = requests.post(url, headers=self.headers, json=data)
        return resp.json()
    
    def search_memory(self, query: str, user_id: str, mem_cube_id: str = "default") -> list:
        url = f"{self.base_url}/product/search"
        data = {
            "query": query,
            "user_id": user_id,
            "mem_cube_id": mem_cube_id
        }
        resp = requests.post(url, headers=self.headers, json=data)
        result = resp.json()
        return result.get("data", [])

def main():
    import argparse
    parser = argparse.ArgumentParser(description="MemOS Client")
    parser.add_argument("--api-key", required=True, help="MemOS API Key")
    parser.add_argument("--add", help="Add memory content")
    parser.add_argument("--search", help="Search memory")
    parser.add_argument("--user-id", default="default", help="User ID")
    args = parser.parse_args()
    
    client = MemOSClient(args.api_key)
    
    if args.add:
        result = client.add_memory(args.add, args.user_id)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif args.search:
        results = client.search_memory(args.search, args.user_id)
        for r in results:
            print(f"- {r}")

if __name__ == "__main__":
    main()