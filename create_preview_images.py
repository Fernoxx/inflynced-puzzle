#!/usr/bin/env python3
"""
Script to generate preview images for InflyncedPuzzle Farcaster miniapp
Creates og-image.png and logo.png with snowflake theme
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import math
    import random
except ImportError:
    print("PIL not available, creating placeholder images...")
    # Create simple placeholder images
    import os
    
    # Create a simple 1200x630 orange image for og-image
    with open('public/og-image.png', 'wb') as f:
        # Simple PNG header for orange image
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x04\xb0\x00\x00\x02v\x08\x06\x00\x00\x00\x8d\x0b\x9a\x9c\x00\x00\x00\x04sBIT\x08\x08\x08\x08|\x08d\x88\x00\x00\x00\x19tEXtSoftware\x00www.inkscape.org\x9b\xee<\x1a\x00\x00\x00\x0bIDATx\x9c\xed\xc1\x01\x00\x00\x00\x80\x90\xfe\xaf\xee\x08\n\x00\x00\x00\x00IEND\xaeB`\x82')
    
    # Create a simple 512x512 icon
    with open('public/logo.png', 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x02\x00\x00\x00\x02\x00\x08\x06\x00\x00\x00\xf4x\xd4\xfa\x00\x00\x00\x04sBIT\x08\x08\x08\x08|\x08d\x88\x00\x00\x00\x19tEXtSoftware\x00www.inkscape.org\x9b\xee<\x1a\x00\x00\x00\x0bIDATx\x9c\xed\xc1\x01\x00\x00\x00\x80\x90\xfe\xaf\xee\x08\n\x00\x00\x00\x00IEND\xaeB`\x82')
    
    print("Created placeholder images")
    exit()

def create_snowflake(draw, center_x, center_y, size, color):
    """Create a simple snowflake pattern"""
    # Main cross
    draw.line([(center_x - size, center_y), (center_x + size, center_y)], fill=color, width=2)
    draw.line([(center_x, center_y - size), (center_x, center_y + size)], fill=color, width=2)
    
    # Diagonal lines
    offset = size * 0.7
    draw.line([(center_x - offset, center_y - offset), (center_x + offset, center_y + offset)], fill=color, width=2)
    draw.line([(center_x - offset, center_y + offset), (center_x + offset, center_y - offset)], fill=color, width=2)
    
    # Small decorative lines
    small_size = size * 0.3
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        x1 = center_x + (size * 0.5) * math.cos(rad)
        y1 = center_y + (size * 0.5) * math.sin(rad)
        x2 = center_x + (size * 0.7) * math.cos(rad)
        y2 = center_y + (size * 0.7) * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=1)

def create_og_image():
    """Create the Open Graph image (1200x630)"""
    width, height = 1200, 630
    
    # Create gradient background
    image = Image.new('RGB', (width, height), '#FF5722')
    draw = ImageDraw.Draw(image)
    
    # Create orange gradient
    for y in range(height):
        r = int(255 * (1 - y / height * 0.2))
        g = int(112 * (1 - y / height * 0.2))
        b = int(34 * (1 - y / height * 0.2))
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Add snowflakes
    random.seed(42)  # For consistent snowflakes
    for _ in range(20):
        x = random.randint(50, width - 50)
        y = random.randint(50, height - 50)
        size = random.randint(15, 35)
        create_snowflake(draw, x, y, size, 'white')
    
    # Add title
    try:
        font_large = ImageFont.truetype("arial.ttf", 72)
        font_medium = ImageFont.truetype("arial.ttf", 36)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
    
    # Main title
    title = "InflyncedPuzzle"
    title_bbox = draw.textbbox((0, 0), title, font=font_large)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    title_y = height // 2 - 80
    
    # Add text shadow
    draw.text((title_x + 3, title_y + 3), title, font=font_large, fill='black')
    draw.text((title_x, title_y), title, font=font_large, fill='white')
    
    # Subtitle
    subtitle = "Sliding Puzzle Game for Farcaster"
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_medium)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    subtitle_y = title_y + 100
    
    draw.text((subtitle_x + 2, subtitle_y + 2), subtitle, font=font_medium, fill='black')
    draw.text((subtitle_x, subtitle_y), subtitle, font=font_medium, fill='white')
    
    # Add puzzle piece emoji
    emoji = "🧩"
    emoji_bbox = draw.textbbox((0, 0), emoji, font=font_large)
    emoji_width = emoji_bbox[2] - emoji_bbox[0]
    emoji_x = (width - emoji_width) // 2
    emoji_y = title_y - 120
    draw.text((emoji_x, emoji_y), emoji, font=font_large)
    
    image.save('public/og-image.png', 'PNG')
    print("Created og-image.png")

def create_logo():
    """Create the logo image (512x512)"""
    size = 512
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Create circular background
    margin = 50
    circle_size = size - 2 * margin
    draw.ellipse([(margin, margin), (size - margin, size - margin)], 
                 fill='#FF5722', outline='white', width=8)
    
    # Add snowflakes
    random.seed(123)
    for _ in range(8):
        x = random.randint(margin + 50, size - margin - 50)
        y = random.randint(margin + 50, size - margin - 50)
        snowflake_size = random.randint(20, 40)
        create_snowflake(draw, x, y, snowflake_size, 'white')
    
    # Add puzzle piece in center
    try:
        font = ImageFont.truetype("arial.ttf", 120)
    except:
        font = ImageFont.load_default()
    
    emoji = "🧩"
    emoji_bbox = draw.textbbox((0, 0), emoji, font=font)
    emoji_width = emoji_bbox[2] - emoji_bbox[0]
    emoji_height = emoji_bbox[3] - emoji_bbox[1]
    emoji_x = (size - emoji_width) // 2
    emoji_y = (size - emoji_height) // 2
    draw.text((emoji_x, emoji_y), emoji, font=font)
    
    image.save('public/logo.png', 'PNG')
    print("Created logo.png")

if __name__ == "__main__":
    print("Generating preview images...")
    create_og_image()
    create_logo()
    print("Preview images created successfully!")