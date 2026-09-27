import cv2
import numpy as np

# Read the image
image = cv2.imread(r'C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\raju_companion_1790536820354.jpg', cv2.IMREAD_UNCHANGED)

# The generated image has a fake transparency checkerboard pattern.
# We will create a mask for the checkerboard.
# Checkerboard colors are usually exact hex values, but they can be slightly off due to compression.
# Let's use floodfill from the top left corner.
h, w = image.shape[:2]
mask = np.zeros((h+2, w+2), np.uint8)

# Convert to RGB (OpenCV uses BGR) for easier color checking if needed
# but floodFill works on BGR directly.
# Flood fill from the corners
cv2.floodFill(image, mask, (0, 0), (255, 255, 255), (10, 10, 10), (10, 10, 10), cv2.FLOODFILL_MASK_ONLY)
cv2.floodFill(image, mask, (w-1, 0), (255, 255, 255), (10, 10, 10), (10, 10, 10), cv2.FLOODFILL_MASK_ONLY)
cv2.floodFill(image, mask, (0, h-1), (255, 255, 255), (10, 10, 10), (10, 10, 10), cv2.FLOODFILL_MASK_ONLY)
cv2.floodFill(image, mask, (w-1, h-1), (255, 255, 255), (10, 10, 10), (10, 10, 10), cv2.FLOODFILL_MASK_ONLY)

# The mask now contains 1 where the background is.
# We want 0 for background and 255 for foreground.
alpha = 255 - (mask[1:h+1, 1:w+1] * 255)

# Add alpha channel
b, g, r = cv2.split(image)
rgba = [b, g, r, alpha]
final_image = cv2.merge(rgba)

cv2.imwrite(r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\uncle_companion.png', final_image)
print("Background removed and saved successfully.")
