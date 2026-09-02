from PIL import Image

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    newData = []
    for item in data:
        # If the pixel is very close to white, make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

make_transparent("frontend/public/trader_silk.jpg", "frontend/public/trader_silk_transparent.png")
make_transparent("frontend/public/trader_jewels.jpg", "frontend/public/trader_jewels_transparent.png")
