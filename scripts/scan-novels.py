#!/usr/bin/env python3
import os, requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

OUTPUT_DIR = Path("/root/.openclaw/workspace/novel/scan-data")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REPOS = [
    ("cungudafa/Chinese-novels", "中文小说"),
    ("mouday/Novel", "网络小说"),
]

def scan_repo(repo):
    files = []
    try:
        r = requests.get(f"https://api.github.com/repos/{repo}/git/trees/main?recursive=1", timeout=30)
        if r.status_code == 200:
            for item in r.json().get('tree', []):
                if item['path'].endswith('.txt'):
                    files.append({
                        'path': item['path'],
                        'url': f"https://raw.githubusercontent.com/{repo}/{item['path']}"
                    })
    except Exception as e:
        print(f"Error: {e}")
    return files

def download(f):
    try:
        r = requests.get(f['url'], timeout=60)
        if r.status_code == 200:
            name = f['path'].split('/')[0]
            (OUTPUT_DIR / name).mkdir(exist_ok=True)
            with open(OUTPUT_DIR / name / f['path'].split('/')[-1], 'w', encoding='utf-8') as fp:
                fp.write(r.text)
            return True
    except:
        pass
    return False

print("开始扫描...")
all_files = []
for repo, _ in REPOS:
    print(f"扫描 {repo}...")
    files = scan_repo(repo)
    print(f"找到 {len(files)} 个文件")
    all_files.extend(files)

print(f"下载中 ({len(all_files)} 个)...")
with ThreadPoolExecutor(max_workers=3) as ex:
    for i, f in enumerate(as_completed([ex.submit(download, f) for f in all_files])):
        print(f"进度: {i+1}/{len(all_files)}")
print(f"完成! 保存位置: {OUTPUT_DIR}")
