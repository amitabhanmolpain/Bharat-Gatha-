import os
from PIL import Image
from collections import deque

def clean_sprite(input_png, output_png):
    img = Image.open(input_png).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # The boots are dark brown / black.
    # The ground shadow has light greyish/tan colors (r>120, g>110, b>90) at the bottom ~60 rows.
    # Let's clean pixels near the bottom:
    for y in range(int(height * 0.93), height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0:
                # Boots soles are very dark (r < 70, g < 60, b < 60) or dark brown
                # Shadow speckles are light grey or brownish-grey
                if r > 85 or g > 85 or b > 85:
                    pixels[x, y] = (0, 0, 0, 0)

    # Remove any isolated floating pixels in the bottom 10%
    for y in range(int(height * 0.92), height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0:
                # Count opaque neighbors
                neighbors = 0
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height and (dx != 0 or dy != 0):
                            if pixels[nx, ny][3] > 0:
                                neighbors += 1
                if neighbors <= 1:
                    pixels[x, y] = (0, 0, 0, 0)

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    img.save(output_png, "PNG")
    print(f"Cleaned: {output_png} size: {img.size}")

out_dir = r"c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public"
clean_sprite(os.path.join(out_dir, "portuguese_traveler_idle.png"), os.path.join(out_dir, "portuguese_traveler_idle.png"))
clean_sprite(os.path.join(out_dir, "portuguese_traveler_talking.png"), os.path.join(out_dir, "portuguese_traveler_talking.png"))
