import os
os.environ['COGNEE_SKIP_CONNECTION_TEST'] = 'true'
os.environ['OPENAI_API_KEY'] = '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'
os.environ['OPENAI_BASE_URL'] = 'https://integrate.api.nvidia.com/v1'
os.environ['LLM_API_KEY'] = os.environ['OPENAI_API_KEY']
os.environ['LLM_BASE_URL'] = os.environ['OPENAI_BASE_URL']

import cognee
import asyncio

async def main():
    # 添加小说设定
    await cognee.add("""陆沉，主角，炼气四层修为，在落云山深处洞府探索。
    灵宠：小黑（嗜血天蛛）。
    宝物：琉璃瓶（可种植灵药，内有冰心莲、地心参）。
    敌人：幽灵宗（追杀了陆沉一个月）。
    功法：噬灵诀（吞噬灵气）、流云十三式（剑法）、经脉淬炼术。""")
    
    # 构建知识图谱
    await cognee.cognify()
    
    # 搜索
    results = await cognee.search("陆沉的灵宠是什么？")
    print("搜索结果:")
    for r in results:
        print(f"- {r}")

asyncio.run(main())
