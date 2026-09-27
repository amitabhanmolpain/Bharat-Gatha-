import os
from rembg import remove
from PIL import Image

# Output directory for processed images
output_dir = r"C:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public"

# Input paths
input_image_2 = r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\indus_priest_anim_2_1790487791859.jpg"
input_image_3 = r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\indus_priest_anim_3_1790488109070.jpg"

def process_and_save(input_path, output_name):
    if not os.path.exists(input_path):
        print(f"Error: Could not find {input_path}")
        return
        
    print(f"Processing {input_path}...")
    try:
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        
        output_path = os.path.join(output_dir, output_name)
        output_image.save(output_path, "PNG")
        print(f"Saved to {output_path}")
    except Exception as e:
        print(f"Failed to process {input_path}: {e}")

process_and_save(input_image_2, "indus_priest_king_follower_anim_2.png")
process_and_save(input_image_3, "indus_priest_king_follower_anim_3.png")

print("Done processing priest sprites.")
