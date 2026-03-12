#!/usr/bin/env python3
"""Simple video maker: Image + Text → Video"""
import os, sys, subprocess
from PIL import Image, ImageDraw, ImageFont

def create_video(image_path, text, output_path="output.mp4", duration=15):
    img = Image.open(image_path)
    img = img.resize((1080, 1920))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    except:
        font = ImageFont.load_default()
    draw.text((540, 1600), text, font=font, fill="white", anchor="mm")
    text_img_path = "/tmp/text_overlay.png"
    img.save(text_img_path)
    cmd = ["ffmpeg", "-y", "-loop", "1", "-i", text_img_path, "-c:v", "libx264", "-t", str(duration), "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2", "-pix_fmt", "yuv420p", output_path]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(f"Video created: {output_path}")
    return True

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--text", default="")
    parser.add_argument("--output", default="output.mp4")
    parser.add_argument("--duration", type=int, default=15)
    args = parser.parse_args()
    if os.path.exists(args.image):
        create_video(args.image, args.text, args.output, args.duration)
    else:
        print(f"Image not found: {args.image}")