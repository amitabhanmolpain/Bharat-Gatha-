from PIL import Image, ImageEnhance

img_path = 'frontend/public/bg-bhangarh-gate.jpg'
img = Image.open(img_path).convert('RGB')
w, h = img.size

# 1. Patch out the crescent moon in top-left sky (x: 235..275, y: 40..85)
moon_box = (235, 40, 275, 85)
sky_sample = img.crop((180, 40, 220, 85))
img.paste(sky_sample, moon_box)

# 2. Process image into pitch-black scary night
pixels = img.load()

for y in range(h):
    for x in range(w):
        r, g, b = pixels[x, y]
        
        # Calculate brightness / torch intensity
        brightness = (r + g + b) / 3.0
        
        # If it's near a torch flame / warm highlight (high R and G relative to B)
        is_torch = (r > 140 and r > b + 40 and g > 60)
        
        if is_torch:
            # Keep torch fire glowing brightly against pitch black
            r_new = min(255, int(r * 1.15))
            g_new = int(g * 0.95)
            b_new = int(b * 0.6)
        else:
            # Sky area (top half of image)
            if y < h * 0.45:
                # Darken sky to pitch black midnight
                r_new = int(r * 0.18)
                g_new = int(g * 0.18)
                b_new = int(b * 0.28)
            else:
                # Stone walls & ground in dark night
                r_new = int(r * 0.38)
                g_new = int(g * 0.35)
                b_new = int(b * 0.40)
                
        pixels[x, y] = (r_new, g_new, b_new)

# Boost contrast to make shadows pitch black and torches pop eerily
enhancer = ImageEnhance.Contrast(img)
img = enhancer.enhance(1.4)

img.save(img_path, quality=95)
print('Successfully converted Bhangarh Gate into pitch black scary night without moon!')
