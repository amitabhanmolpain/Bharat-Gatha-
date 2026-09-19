from rembg import remove
from PIL import Image

input_path = r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\wooden_oar_icon_1789838095667.jpg"
output_path = r"C:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\wooden_oar.png"

input = Image.open(input_path)
output = remove(input)
output.save(output_path)
print("Background removed and image saved!")
