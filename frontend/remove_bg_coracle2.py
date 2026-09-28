import cv2
import numpy as np

def process_image(input_path, output_path):
    img = cv2.imread(input_path)
    if img is None:
        print(f"Could not read {input_path}")
        return
        
    h, w = img.shape[:2]
    colors = []
    # Sample top row
    for i in range(0, w, 10):
        color = img[0, i]
        is_new = True
        for c in colors:
            if np.all(np.abs(c.astype(int) - color.astype(int)) < 20):
                is_new = False
                break
        if is_new:
            colors.append(color)

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
    print(f"Saved {output_path}")

process_image(r'C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\coracle_new_1_1790539037136.jpg', r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\coracle_row_1.png')
process_image(r'C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\coracle_new_2_1790539063221.jpg', r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\coracle_row_2.png')
process_image(r'C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\coracle_new_3_1790539094691.jpg', r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\coracle_row_3.png')
process_image(r'C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\coracle_new_4_1790539122020.jpg', r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\coracle_row_4.png')
