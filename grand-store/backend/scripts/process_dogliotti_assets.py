import os
import shutil
from PIL import Image, ImageOps

scratch_dir = "scratch/dogliotti_images"
backend_estate_dir = "d:/Grand Store/the-grand-store/grand-store/frontend/public/assets/estate/dogliotti-1870"
backend_prod_dir = "d:/Grand Store/the-grand-store/grand-store/frontend/public/assets/products/dogliotti-1870"
local_estate_dir = "d:/Grand Store/the-grand-store/grand-storelocal/frontend/public/assets/estate/dogliotti-1870"
local_prod_dir = "d:/Grand Store/the-grand-store/grand-storelocal/frontend/public/assets/products/dogliotti-1870"

for d in [backend_estate_dir, backend_prod_dir, local_estate_dir, local_prod_dir]:
    os.makedirs(d, exist_ok=True)

def make_transparent_bottle(src_path, dest_paths, threshold=245):
    img = Image.open(src_path).convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        # If near white, make transparent
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # Trim excess transparent border
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        # Add 10px padding
        padded = Image.new("RGBA", (img.width + 20, img.height + 20), (255, 255, 255, 0))
        padded.paste(img, (10, 10))
        img = padded

    for dp in dest_paths:
        img.save(dp, "PNG")
    print(f"Saved bottle: {os.path.basename(dest_paths[0])} (size: {img.size})")

def process_estate_image(src_path, filename):
    img = Image.open(src_path)
    # Save optimized JPEG/PNG
    for target_dir in [backend_estate_dir, local_estate_dir]:
        dest = os.path.join(target_dir, filename)
        if filename.endswith(".png"):
            img.save(dest, "PNG")
        else:
            img.convert("RGB").save(dest, "JPEG", quality=90)
    print(f"Saved estate image: {filename}")

# 1. Process Estate Images
estate_images_map = {
    "presentation_p1_img1_7.jpeg": "dogliotti_emblem.jpg",
    "pricelist_p1_img1_31.png": "dogliotti_logo_crest.png",
    "presentation_p2_img1_35.jpeg": "dogliotti_langhe_monferrato_hero.jpg",
    "presentation_p3_img1_38.jpeg": "dogliotti_vineyard_panorama.jpg",
    "presentation_p4_img1_48.jpeg": "dogliotti_historic_tasting_cellar.jpg",
    "presentation_p5_img1_52.jpeg": "dogliotti_cask_barrel_hall.jpg",
    "presentation_p6_img1_59.jpeg": "erik_dogliotti.jpg",
    "presentation_p6_img3_62.jpeg": "ivan_dogliotti.jpg",
    "presentation_p6_img5_65.jpeg": "matteo_dogliotti.jpg",
    "presentation_p9_img1_86.jpeg": "dogliotti_rolling_hills.jpg",
    "presentation_p14_img1_116.jpeg": "dogliotti_brick_vault_cellar.jpg",
    "presentation_p15_img1_119.jpeg": "dogliotti_golden_sunset.jpg",
    "presentation_p19_img1_136.jpeg": "dogliotti_winery_courtyard.jpg"
}

for src_name, target_name in estate_images_map.items():
    src = os.path.join(scratch_dir, src_name)
    if os.path.exists(src):
        process_estate_image(src, target_name)

# Make transparent crest logo from pricelist_p1_img1_31.png
logo_src = os.path.join(scratch_dir, "pricelist_p1_img1_31.png")
if os.path.exists(logo_src):
    logo_img = Image.open(logo_src).convert("RGBA")
    # Make white background transparent
    data = logo_img.getdata()
    new_data = []
    for item in data:
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    logo_img.putdata(new_data)
    bbox = logo_img.getbbox()
    if bbox:
        logo_img = logo_img.crop(bbox)
    for target_dir in [backend_estate_dir, local_estate_dir]:
        logo_img.save(os.path.join(target_dir, "dogliotti_logo_transparent.png"), "PNG")
    print("Saved transparent logo crest!")

# 2. Process Bottle Images
bottles_map = {
    # Asti & Spumanti
    "dogliotti-spumante-brut.png": "presentation_p7_img1_68.jpeg",
    "dogliotti-asti-spumante-docg.png": "presentation_p7_img2_69.jpeg",
    "dogliotti-alta-langa-docg.png": "presentation_p8_img1_79.jpeg",
    "dogliotti-alta-langa-rose-docg.png": "presentation_p8_img2_80.jpeg",
    "dogliotti-alta-langa-riserva-docg-2020.png": "presentation_p8_img3_82.jpeg",
    "dogliotti-alta-langa-riserva-single-box.png": "presentation_p8_img3_82.jpeg",
    
    # White Wines
    "dogliotti-roero-arneis-docg-2025.png": "presentation_p10_img1_89.jpeg",
    "dogliotti-piemonte-doc-chardonnay-2025.png": "presentation_p10_img2_90.jpeg",
    
    # Family Wines
    "dogliotti-bianco-damelio-2022.png": "presentation_p11_img1_100.jpeg",
    "dogliotti-rosa-delsa-2023.png": "presentation_p11_img2_101.jpeg",
    
    # Traditional Reds
    "dogliotti-dolcetto-dalba-doc-2025.png": "presentation_p12_img1_104.jpeg",
    "dogliotti-grignolino-dasti-doc-2025.png": "presentation_p12_img2_105.jpeg",
    
    # Monferrato Reds
    "dogliotti-barbis-barbera-frizzante-2025.png": "presentation_p13_img1_110.jpeg",
    "dogliotti-barbera-dasti-docg-2024.png": "presentation_p13_img2_111.jpeg",
    "dogliotti-barbera-dasti-superiore-docg-2023.png": "presentation_p13_img3_112.jpeg",
    "dogliotti-nizza-docg-2021.png": "presentation_p13_img4_113.jpeg",
    
    # Langhe Reds
    "dogliotti-nebbiolo-dalba-doc-2024.png": "presentation_p16_img1_122.jpeg",
    "dogliotti-barbaresco-docg-2021.png": "presentation_p16_img2_123.jpeg",
    "dogliotti-barolo-docg-2022.png": "presentation_p16_img3_124.jpeg",
    
    # Moscati
    "dogliotti-moscato-dasti-docg-screwcap-2026.png": "presentation_p17_img4_127.jpeg",
    "dogliotti-moscato-dasti-docg-berlet-2026.png": "presentation_p17_img5_128.jpeg",
    "dogliotti-moscato-dasti-docg-erik-2011.png": "presentation_p17_img6_129.jpeg",
    "dogliotti-moscato-dasti-docg-erik-2015.png": "presentation_p17_img6_129.jpeg",
    "dogliotti-moscato-dasti-docg-erik-2016.png": "presentation_p17_img6_129.jpeg",
    "dogliotti-moscato-dasti-docg-erik-2017.png": "presentation_p17_img6_129.jpeg",
    "dogliotti-moscato-dasti-docg-erik-2021.png": "presentation_p17_img6_129.jpeg",
    
    # Vermouth 18/70
    "dogliotti-vermouth-18-70-bianco.png": "presentation_p18_img1_132.jpeg",
    "dogliotti-vermouth-18-70-rosso.png": "presentation_p18_img2_133.jpeg"
}

for bottle_filename, src_name in bottles_map.items():
    src = os.path.join(scratch_dir, src_name)
    if os.path.exists(src):
        targets = [
            os.path.join(backend_prod_dir, bottle_filename),
            os.path.join(local_prod_dir, bottle_filename)
        ]
        make_transparent_bottle(src, targets)

print("All Dogliotti 1870 assets processed successfully!")
