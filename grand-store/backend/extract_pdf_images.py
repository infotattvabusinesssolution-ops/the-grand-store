import fitz
import os
import sys

pdf_path = sys.argv[1]
output_dir = sys.argv[2]
os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)
count = 0
for page_index in range(len(doc)):
    page = doc[page_index]
    image_list = page.get_images(full=True)
    
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        image_width = base_image["width"]
        image_height = base_image["height"]
        
        image_filename = f"image_{page_index+1}_{img_index+1}_{image_width}x{image_height}.{image_ext}"
        image_filepath = os.path.join(output_dir, image_filename)
        
        with open(image_filepath, "wb") as f:
            f.write(image_bytes)
            
        print(f"Extracted {image_filename}")
        count += 1

print(f"Total images extracted: {count}")
