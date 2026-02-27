#!/bin/bash
# MV 合成脚本 - 生成时间: 2026-02-24 14:46:56

AUDIO_FILE="song.mp3"
OUTPUT_FILE="final_mv.mov"

# 检查文件是否存在
for i in $(seq 1 16); do
    if [ ! -f "video_$(printf "%02d" $i).mp4" ]; then
        echo "错误: 找不到 video_$(printf "%02d" $i).mp4"
        exit 1
    fi
done

# 合并视频
FFMPEG_CMD="ffmpeg -y"

  FFMPEG_CMD="$FFMPEG_CMD -i video_01.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_02.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_03.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_04.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_05.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_06.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_07.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_08.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_09.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_10.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_11.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_12.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_13.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_14.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_15.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i video_16.mp4"
  FFMPEG_CMD="$FFMPEG_CMD -i \"$AUDIO_FILE\""
  FFMPEG_CMD="$FFMPEG_CMD -filter_complex \"[0:v]concat=n=16:v=1:a=0[out]\" -map \"[out]\" -map 1:a -c:v libx264 -c:a aac -shortest \"$OUTPUT_FILE\""

eval $FFMPEG_CMD
echo "MV 生成完成: $OUTPUT_FILE"