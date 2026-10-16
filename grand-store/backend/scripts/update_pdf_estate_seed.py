import json
import re
import os

backend_dir = r"d:\Grand Store\the-grand-store\grand-store\backend"
urls_file = os.path.join(backend_dir, "scratch_pdf_estate_urls.json")
with open(urls_file, "r", encoding="utf-8") as f:
    urls = json.load(f)

seed_file = os.path.join(backend_dir, "scripts", "seedBrunoAndreu.js")
with open(seed_file, "r", encoding="utf-8") as f:
    content = f.read()

# Update heroImageUrl
content = re.sub(r"heroImageUrl:\s*'[^']+'", f"heroImageUrl: '{urls['ba_cellar_barrels']}'", content)

# Update logoUrl
content = re.sub(r"logoUrl:\s*'[^']+'", f"logoUrl: '{urls['ba_logo_emblem']}'", content)

# Update vineyard.imageUrl
content = re.sub(r"vineyard:\s*\{[\s\S]*?imageUrl:\s*'[^']+'", 
                 lambda m: re.sub(r"imageUrl:\s*'[^']+'", f"imageUrl: '{urls['ba_pure_barrels']}'", m.group(0)), 
                 content)

# Update hospitality.tastingsImageUrl
content = re.sub(r"tastingsImageUrl:\s*'[^']+'", f"tastingsImageUrl: '{urls['ba_wine_thief_pour']}'", content)

# Update tasting items
content = re.sub(r"(name:\s*'Creator Discovery Tasting'[\s\S]*?imageUrl:\s*)'[^']+'", 
                 rf"\g<1>'{urls['ba_cheers_glasses']}'", content)
content = re.sub(r"(name:\s*'Bespoke Masterclass & Cellar Walkthrough'[\s\S]*?imageUrl:\s*)'[^']+'", 
                 rf"\g<1>'{urls['ba_blending_masterclass']}'", content)
content = re.sub(r"(name:\s*'Zero-Alcohol Innovation Flight'[\s\S]*?imageUrl:\s*)'[^']+'", 
                 rf"\g<1>'{urls['ba_wine_thief_pour']}'", content)

# Update story.images
story_imgs = json.dumps([
    urls['ba_bruno_elixir_magnum'],
    urls['ba_cellar_barrels'],
    urls['ba_blending_masterclass'],
    urls['ba_chardonnay_table']
], indent=8)
content = re.sub(r"story:\s*\{[\s\S]*?images:\s*\[[\s\S]*?\]", 
                 lambda m: re.sub(r"images:\s*\[[\s\S]*?\]", f"images: {story_imgs}", m.group(0)), 
                 content)

# Update galleryUrls
gallery_urls = json.dumps([
    urls['ba_cellar_barrels'],
    urls['ba_bruno_elixir_magnum'],
    urls['ba_wine_thief_pour'],
    urls['ba_blending_masterclass'],
    urls['ba_celebration_splash'],
    urls['ba_chardonnay_table'],
    urls['ba_cheers_glasses'],
    urls['ba_pure_barrels']
], indent=6)
content = re.sub(r"galleryUrls:\s*\[[\s\S]*?\]", f"galleryUrls: {gallery_urls}", content)

with open(seed_file, "w", encoding="utf-8") as f:
    f.write(content)

print("seedBrunoAndreu.js successfully updated with authentic PDF estate images!")
