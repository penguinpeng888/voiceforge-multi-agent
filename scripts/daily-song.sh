#!/bin/bash
WORKDIR="/root/.openclaw/workspace"
MUSICDIR="$WORKDIR/music-daily"
LOGFILE="/tmp/daily-song.log"
TODAY=$(date +%Y-%m-%d)

if [ -f "$MUSICDIR/${TODAY}-歌词.txt" ]; then
    echo "$TODAY 已生成，跳过" >> $LOGFILE
    exit 0
fi

cd $WORKDIR
python3 << 'PY'
import random
from datetime import datetime
themes = ["城市夜晚的孤独","雨后的咖啡馆","地铁站的人群","凌晨三点的便利店","海边的黄昏"]
styles = ["Soft Chinese pop ballad","Acoustic folk","Indie pop with gentle piano"]
t = datetime.now().strftime("%Y-%m-%d")
lyrics = f"""《城市边缘的咖啡馆》
【主歌1】
午后的阳光 懒懒地洒
老式唱片机 转动着沙哑
角落里的位置 属于我俩
窗外行人匆匆 走过冬夏
【副歌】
城市边缘的咖啡馆 收留着 所有的不甘
每一口苦涩 咽下 明天又是新的一天"""
with open(f"/root/.openclaw/workspace/music-daily/{t}-歌词.txt","w") as f: f.write(lyrics)
suno = "[Verse]\n城市边缘的咖啡馆，温暖的午后阳光\n---\nStyle: "+random.choice(styles)+", 4:30"
with open(f"/root/.openclaw/workspace/music-daily/{t}-Suno提示词.txt","w") as f: f.write(suno)
cover = "A cozy cafe, warm afternoon sunlight, vintage record player"
with open(f"/root/.openclaw/workspace/music-daily/{t}-提示词.txt","w") as f: f.write(cover)
print("done")
PY
echo "$(date) 完成" >> $LOGFILE
