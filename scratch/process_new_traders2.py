from PIL import Image

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    newData = []
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

make_transparent("/Users/aniruddhapain/.gemini/antigravity/brain/8fb789ad-270c-4b5f-b551-d4c6b3359775/trader_toys_1788278706979.jpg", "frontend/public/trader_toys_transparent.png")
make_transparent("/Users/aniruddhapain/.gemini/antigravity/brain/8fb789ad-270c-4b5f-b551-d4c6b3359775/trader_marble_1788278732236.jpg", "frontend/public/trader_marble_transparent.png")
