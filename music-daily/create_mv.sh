#!/bin/bash
WORKDIR="/root/.openclaw/workspace/music-daily"
COVER="$WORKDIR/2026-02-27-封面.png"
ffmpeg -y -loop 1 -i "$COVER" -c:v libx264 -t 15 -pix_fmt yuv420p -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" "$WORKDIR/2026-02-27-MV.mp4"
echo "MV created"