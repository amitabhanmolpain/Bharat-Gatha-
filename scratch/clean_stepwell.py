from PIL import Image, ImageEnhance

img_path = 'frontend/public/bg-kuldhara-stepwell.jpg'
img = Image.open(img_path).convert('RGB')

# Coordinates of background figures to patch (x1, y1, x2, y2, ox, oy)
patches = [
    # Figures on top central stairs
    (630, 165, 660, 215, -40, 0),
    (670, 165, 700, 215, 40, 0),
    (700, 240, 735, 290, 40, 0),
    
    # Figures on left middle stairs / ledges
    (560, 255, 595, 300, -35, 0),
    (250, 390, 290, 470, -30, 0),
    (615, 435, 650, 490, 35, 0),
    (840, 320, 875, 370, 35, 0),
    
    # Figures on right stairs / ledges
    (1040, 470, 1075, 530, 35, 0),
    (770, 460, 805, 520, -35, 0),
    (790, 320, 825, 370, -35, 0),
    
    # Figures on middle crossbridge
    (770, 260, 810, 310, 35, 0),
    (425, 250, 455, 295, -35, 0),
]

for x1, y1, x2, y2, ox, oy in patches:
    src_box = (x1 + ox, y1 + oy, x2 + ox, y2 + oy)
    dest_box = (x1, y1, x2, y2)
    region = img.crop(src_box)
    img.paste(region, dest_box)

# Apply Evening Sunset color filter
r, g, b = img.split()
r = r.point(lambda i: min(255, int(i * 1.08)))
g = g.point(lambda i: min(255, int(i * 1.02)))
b = b.point(lambda i: int(i * 0.90))

evening_img = Image.merge('RGB', (r, g, b))

# Enhance contrast & warm color saturation for evening mood
enhancer = ImageEnhance.Contrast(evening_img)
evening_img = enhancer.enhance(1.08)

enhancer = ImageEnhance.Color(evening_img)
evening_img = enhancer.enhance(1.15)

evening_img.save(img_path, quality=95)
print('Successfully processed evening stepwell background!')
