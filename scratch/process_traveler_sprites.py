import os
from PIL import Image, ImageFilter
from collections import deque

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Visited grid for BFS flood fill
    visited = [[False for _ in range(height)] for _ in range(width)]
    queue = deque()

    # Seed all border pixels
    for x in range(width):
        for y in [0, height - 1]:
            r, g, b, a = pixels[x, y]
            # If it's near white/light grey or ground shadow
            if r > 230 and g > 230 and b > 230:
                queue.append((x, y))
                visited[x][y] = True

    for y in range(height):
        for x in [0, width - 1]:
            if not visited[x][y]:
                r, g, b, a = pixels[x, y]
                if r > 230 and g > 230 and b > 230:
                    queue.append((x, y))
                    visited[x][y] = True

    # BFS to find background
    while queue:
        cx, cy = queue.popleft()
        pixels[cx, cy] = (0, 0, 0, 0)

        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height and not visited[nx][ny]:
                r, g, b, a = pixels[nx, ny]
                # If near white, continue flood fill
                # Also handle the soft grey/brown shadow at the bottom
                is_bg_white = (r > 225 and g > 225 and b > 225)
                is_ground_shadow = (cy > height * 0.88 and r > 110 and r == g and g == b) or \
                                   (cy > height * 0.88 and abs(r - g) < 20 and abs(g - b) < 20 and r > 90 and r < 200)
                
                if is_bg_white or is_ground_shadow:
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    # Also clean up any lingering isolated pixels in the bottom shadow if any
    for y in range(int(height * 0.90), height):
        for x in range(width):
            if not visited[x][y]:
                # Check if surrounded mostly by transparent pixels
                r, g, b, a = pixels[x, y]
                if r > 200 and g > 200 and b > 200:
                    pixels[x, y] = (0, 0, 0, 0)

    # Crop to bounding box of non-transparent pixels with small margin
    bbox = img.getbbox()
    if bbox:
        # Keep full height alignment so anchor point at bottom stays consistent
        img = img.crop(bbox)

    img.save(output_path, "PNG")
    print(f"Saved: {output_path} (size: {img.size})")

dir_path = r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561"
idle_in = os.path.join(dir_path, "portuguese_traveler_idle_1789663591225.jpg")
talking_in = os.path.join(dir_path, "portuguese_traveler_talking_1789663613382.jpg")

out_dir = r"c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public"
idle_out = os.path.join(out_dir, "portuguese_traveler_idle.png")
talking_out = os.path.join(out_dir, "portuguese_traveler_talking.png")

make_transparent(idle_in, idle_out)
make_transparent(talking_in, talking_out)
