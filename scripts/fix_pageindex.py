import re
f = open('/root/.openclaw/workspace/PageIndex/pageindex/utils.py', 'r')
c = f.read()
f.close()

# Add OPENAI_API_BASE after CHATGPT_API_KEY line
c = c.replace(
    'CHATGPT_API_KEY = os.getenv("CHATGPT_API_KEY")',
    'CHATGPT_API_KEY = os.getenv("CHATGPT_API_KEY")\nOPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")'
)

# Add base_url to openai.OpenAI()
c = c.replace(
    'client = openai.OpenAI(api_key=api_key)',
    'client = openai.OpenAI(api_key=api_key, base_url=OPENAI_API_BASE)'
)

c = c.replace(
    'async with openai.AsyncOpenAI(api_key=api_key) as client:',
    'async with openai.AsyncOpenAI(api_key=api_key, base_url=OPENAI_API_BASE) as client:'
)

f = open('/root/.openclaw/workspace/PageIndex/pageindex/utils.py', 'w')
f.write(c)
f.close()
print("Done!")