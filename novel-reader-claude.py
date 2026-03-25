#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" 命令行小说阅读器 (Command-Line Novel Reader) 支持章节分页、进度保存、书签、搜索、阅读统计和主题切换 """
import os
import sys
import json
import re
import time
import argparse
import datetime
from pathlib import Path
from typing import Optional

# 尝试导入 colorama，若未安装则自动安装
try:
    from colorama import init, Fore, Back, Style
    init(autoreset=True)
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "colorama", "-q"])
    from colorama import init, Fore, Back, Style
    init(autoreset=True)

# ... (完整代码见用户提交版本)
# 代码已保存
