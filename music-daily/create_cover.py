#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# Create 1000x1000 cover image
width, height = 1000, 1000
img = Image.new('RGB', (width, height), '#1a1a2e')
draw = ImageDraw.Draw(img)

# Draw gradient background (simplified - using shapes)
for i in range(0, 500, 10):
    color_val = int(26 + i * 0.3)
    draw.rectangle([0, i*2, width, i*2+20], fill=(26, color_val, color_val+20))

# Draw moon
draw.ellipse([700, 80, 850, 230], fill='#f5d76e', outline='#e67e22', width=3)

# Draw bridge silhouette
draw.polygon([(100, 600), (250, 500), (400, 600), (400, 800), (100, 800)], fill='#0f0f23')
draw.polygon([(400, 600), (550, 480), (700, 600), (700, 800), (400, 800)], fill='#0f0f23')

# Draw river reflection
for y in range(600, 1000, 20):
    alpha = 255 - int((y - 600) / 400 * 200)
    draw.rectangle([100, y, 900, y+15], fill=(15, 15, 35, alpha))

# Draw small boat
draw.polygon([(450, 620), (520, 620), (500, 660)], fill='#8b4513')
draw.ellipse([460, 550, 510, 600], fill='#f5d76e')

# Draw text: song title
try:
    font_large = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 60)
    font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 30)
except:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

draw.text((500, 750), '枫桥夜泊·爵士梦', fill='#f5d76e', anchor='mm', font=font_large)
draw.text((500, 820), '古风民谣 × JAZZ', fill='#a0a0c0', anchor='mm', font=font_small)

# Draw NetEase Cloud style circle logo
draw.ellipse([50, 50, 120, 120], fill='#e74c3c')
draw.ellipse([60, 60, 110, 110], fill='#c0392b')

# Save
output_path = '/root/.openclaw/workspace/music-daily/2026-02-27-封面.png'
img.save(output_path, 'PNG')
print(f'Cover saved to {output_path}')