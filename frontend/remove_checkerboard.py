import cv2
import numpy as np
import sys

# Read the generated image (it's a jpg with a fake checkerboard background)
image_path = r'C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\raju_companion_1790536820354.jpg'
output_path = r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\uncle_companion.png'

img = cv2.imread(image_path)
if img is None:
    print("Could not read image")
    sys.exit(1)

# The checkerboard has two colors. We can sample them from the top-left corner
color1 = img[0, 0]
# The squares are usually 16x16 or 32x32. Let's sample a few pixels to find the second color.
color2 = None
for i in range(100):
    if not np.array_equal(img[0, i], color1):
        color2 = img[0, i]
        break

if color2 is None:
    # Maybe it's a solid background
    color2 = color1

print(f"Checkerboard colors: {color1}, {color2}")

# Create a mask for both colors (with a small tolerance for jpeg artifacts)
tolerance = 15
diff1 = np.abs(img.astype(int) - color1.astype(int))
mask1 = np.all(diff1 <= tolerance, axis=-1)

diff2 = np.abs(img.astype(int) - color2.astype(int))
mask2 = np.all(diff2 <= tolerance, axis=-1)

# Combine masks
bg_mask = mask1 | mask2

# Invert mask to get foreground
fg_mask = ~bg_mask

# Convert to BGRA
b, g, r = cv2.split(img)
alpha = np.zeros_like(b, dtype=np.uint8)
alpha[fg_mask] = 255

# Apply some morphological operations to clean up the edges if needed, but for pixel art, raw might be better.
rgba = cv2.merge([b, g, r, alpha])

cv2.imwrite(output_path, rgba)
print("Saved transparent image!")
