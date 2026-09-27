import cv2
import numpy as np

image_path = r'C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\raju_companion_1790536820354.jpg'
output_path = r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\uncle_companion.png'

img = cv2.imread(image_path)

# Sample the top row to find the checkerboard colors
h, w = img.shape[:2]
colors = []
for i in range(0, w, 10):
    color = img[0, i]
    # Check if this color is already in our list (with tolerance)
    is_new = True
    for c in colors:
        if np.all(np.abs(c.astype(int) - color.astype(int)) < 20):
            is_new = False
            break
    if is_new:
        colors.append(color)

print(f"Detected background colors: {colors}")

# Combine masks for all detected background colors
bg_mask = np.zeros(img.shape[:2], dtype=bool)
for c in colors:
    diff = np.abs(img.astype(int) - c.astype(int))
    mask = np.all(diff <= 25, axis=-1)
    bg_mask = bg_mask | mask

fg_mask = ~bg_mask

b, g, r = cv2.split(img)
alpha = np.zeros_like(b, dtype=np.uint8)
alpha[fg_mask] = 255

rgba = cv2.merge([b, g, r, alpha])
cv2.imwrite(output_path, rgba)
print("Saved perfectly clean transparent image!")
