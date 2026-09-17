from PIL import Image, ImageEnhance, ImageFilter

img_path = 'frontend/public/bg-kuldhara-stepwell.jpg'
img = Image.open(img_path).convert('RGB')
w, h = img.size

# List of all figures to remove: (x1, y1, x2, y2, source_x_offset, source_y_offset)
all_figures = [
    # 1. Bottom-right villager with cloak & backpack (x: 880..960, y: 590..730)
    # Patch from adjacent stone pavement floor to the left (ox = -100)
    (885, 590, 960, 730, -90, 0),
    
    # 2. Central archway figure (x: 600..635, y: 330..375)
    # Patch from dark arch opening to the left (ox = -45)
    (605, 330, 635, 380, -40, 0),
    
    # 3. Left middle stairs figure (x: 440..465, y: 430..470)
    # Patch from stone stair texture on right (ox = 35)
    (440, 430, 470, 475, 35, 0),
    
    # 4. Top central stairs figure (x: 640..670, y: 175..215)
    # Patch from adjacent stone stairs (ox = -35)
    (640, 175, 670, 215, -35, 0),
    
    # 5. Right middle stairs figure (x: 835..865, y: 445..485)
    # Patch from adjacent stair texture (ox = 35)
    (835, 445, 865, 485, 35, 0),
    
    # 6. Upper left balcony figure (x: 580..605, y: 250..290)
    # Patch from adjacent wall/pillar texture (ox = -35)
    (580, 250, 605, 290, -35, 0),
    
    # 7. Upper right balcony figure (x: 770..805, y: 250..290)
    (770, 250, 805, 290, 35, 0),
]

for x1, y1, x2, y2, ox, oy in all_figures:
    src_box = (x1 + ox, y1 + oy, x2 + ox, y2 + oy)
    dest_box = (x1, y1, x2, y2)
    region = img.crop(src_box)
    img.paste(region, dest_box)

img.save(img_path, quality=95)
print('Successfully cleaned ALL people from Kuldhara stepwell background!')
