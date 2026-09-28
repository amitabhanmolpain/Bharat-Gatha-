import os
from PIL import Image

output_dir = r"c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public"

sources = [
    (r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\crowd_citizen_1_1790602932419.jpg", "crowd_citizen_1.png"),
    (r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\crowd_citizen_2_1790602968769.jpg", "crowd_citizen_2.png"),
    (r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\crowd_citizen_3_1790603006028.jpg", "crowd_citizen_3.png"),
    (r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\crowd_citizen_4_1790603047084.jpg", "crowd_citizen_4.png"),
]

def make_transparent(img_path, out_name):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Check if color is close to white (R, G, B > 235)
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    out_path = os.path.join(output_dir, out_name)
    img.save(out_path, "PNG")
    print(f"Saved: {out_path}")

for src_path, filename in sources:
    if os.path.exists(src_path):
        make_transparent(src_path, filename)
    else:
        print(f"Source not found: {src_path}")
