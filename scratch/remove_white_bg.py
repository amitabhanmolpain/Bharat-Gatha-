from PIL import Image

def remove_white_bg(input_path, output_path, tolerance=30):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is close to white
        if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
            # Change white to transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

input_path = r"C:\Users\ami05\.gemini\antigravity-ide\brain\6cc172be-6b2a-4513-8ba8-99b349c01561\wooden_oar_icon_1789838095667.jpg"
output_path = r"C:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\wooden_oar.png"

remove_white_bg(input_path, output_path, tolerance=10)
print("Solid background removed and image saved!")
