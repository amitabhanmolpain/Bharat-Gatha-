from rembg import remove
from PIL import Image

input_path = r'C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\raju_companion_1790536820354.jpg'
output_path = r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\uncle_companion.png'

print("Processing image with rembg...")
input_image = Image.open(input_path)
output_image = remove(input_image)
output_image.save(output_path)
print("Saved clean transparent image to:", output_path)
