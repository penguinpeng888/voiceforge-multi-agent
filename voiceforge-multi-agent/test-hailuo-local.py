#!/usr/bin/env python3
"""
海螺AI TTS 本地测试脚本
在你电脑上运行，需要先安装 playwright
"""
import asyncio
from playwright.async_api import async_playwright

async def test_hailuo():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        await page.goto("https://hailuoai.com/tts")
        await page.wait_for_load_state("networkidle")
        
        print("页面加载完成！")
        print("请查看页面结构，告诉我：")
        print("1. 文本输入框的 HTML selector")
        print("2. 生成按钮的文本内容")
        print("3. 声音选择的选项")
        
        # 截图保存
        await page.screenshot(path="hailuo-page.png")
        print("截图已保存: hailuo-page.png")
        
        await asyncio.sleep(30)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_hailuo())