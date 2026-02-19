import sys
sys.stdout.reconfigure(encoding='utf-8')
import replicate
import urllib.request
import os
import time

ASSETS = "C:/Users/useva/.openclaw/workspace/projects/card-ledger/public/assets"
os.makedirs(ASSETS, exist_ok=True)

images = [
    ("hero-bg.png", "16:9", "Futuristic dark scene with holographic Pokemon trading cards floating in 3D space, glass panels with glowing blue data visualizations, deep navy and purple gradient background, volumetric lighting rays, bokeh particles, cinematic composition, ultra high quality"),
    ("feature-track.png", "1:1", "Glass display case with holographic trading cards arranged in a grid, each card glowing with iridescent rainbow edges, dark background with blue ambient light, museum-quality presentation, ultra realistic, professional product photography"),
    ("feature-price.png", "1:1", "Futuristic holographic price dashboard floating in dark space, glowing blue and purple charts and numbers, glass panels with market data, trading card silhouettes in background, cinematic lighting, high tech financial interface aesthetic"),
    ("feature-scan.png", "1:1", "Smartphone scanning a holographic Pokemon card with AR augmented reality overlay, blue scanning laser lines, card data floating in glass panels around the phone, dark background, futuristic tech aesthetic, professional"),
    ("feature-profit.png", "1:1", "Holographic portfolio analytics dashboard floating in dark space, glowing green profit chart trending upward, glass panels with card thumbnails, blue and purple ambient light, futuristic financial visualization, cinematic"),
    ("empty-inventory.png", "1:1", "Single holographic trading card floating in dark void, soft blue glow emanating from the card, minimalist, particles of light, ethereal and calm, centered composition, clean negative space"),
    ("empty-search.png", "1:1", "Glass magnifying lens floating in dark space, blue light refracting through the lens, scattered light particles, minimalist futuristic aesthetic, clean and elegant"),
    ("empty-sales.png", "1:1", "Holographic receipt transforming into a glowing chart, blue and green light, glass effect, dark background, futuristic financial transformation concept, minimalist"),
    ("onboard-welcome.png", "9:16", "Single holographic Pokemon card bursting with prismatic light rays, dark background, epic and dramatic, card emerging from darkness into brilliant blue and purple light, cinematic vertical composition"),
    ("onboard-scan.png", "9:16", "Hands holding smartphone scanning a trading card, AR overlay with blue holographic data, card identification interface, dark background, futuristic mobile technology, vertical composition"),
    ("onboard-track.png", "9:16", "Beautiful glass dashboard showing trading card collection grid, holographic cards organized in rows, portfolio value displayed prominently, dark background with blue glow, vertical composition"),
    ("onboard-price.png", "9:16", "Futuristic price ticker display with holographic numbers and charts, trading cards with price tags floating, market data visualization, blue and green accents on dark background, vertical composition"),
    ("onboard-profit.png", "9:16", "Portfolio growth visualization, glowing green upward trending line chart, holographic coins and trading cards, celebration energy, dark background with blue and green light, vertical composition"),
    ("og-share.png", "16:9", "Premium dark banner with holographic trading cards fanned out, glass panel overlay, blue and purple gradient, professional and sleek, wide cinematic composition, card collection showcase"),
    ("empty-watchlist.png", "1:1", "Futuristic eye icon with blue radar pulse rings emanating outward, dark background, holographic glass effect, surveillance and monitoring aesthetic, minimalist and clean"),
]

for i, (filename, aspect, prompt) in enumerate(images):
    print(f"\n[{i+1}/{len(images)}] Generating {filename} ({aspect})...", flush=True)
    try:
        output = replicate.run(
            "black-forest-labs/flux-1.1-pro",
            input={"prompt": prompt, "aspect_ratio": aspect, "output_format": "png", "safety_tolerance": 5}
        )
        url = str(output)
        filepath = os.path.join(ASSETS, filename)
        urllib.request.urlretrieve(url, filepath)
        size = os.path.getsize(filepath)
        print(f"  OK Saved: {filename} ({size//1024} KB)", flush=True)
    except Exception as e:
        print(f"  FAIL: {filename} - {e}", flush=True)
    
    if i < len(images) - 1:
        print(f"  Waiting 65s...", flush=True)
        time.sleep(65)

print("\n" + "="*50, flush=True)
print("SUMMARY", flush=True)
print("="*50, flush=True)
for filename, _, _ in images:
    filepath = os.path.join(ASSETS, filename)
    if os.path.exists(filepath):
        size = os.path.getsize(filepath)
        print(f"  OK {filename}: {size//1024} KB", flush=True)
    else:
        print(f"  MISSING {filename}", flush=True)
print("DONE", flush=True)
