from PIL import Image

def remove_black_background(img_path, out_path):
    try:
        img = Image.open(img_path).convert("RGBA")
    except Exception as e:
        print("Failed to open image:", e)
        return
    datas = img.getdata()

    new_data = []
    for item in datas:
        if item[0] < 15 and item[1] < 15 and item[2] < 15:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(out_path, "PNG")
    print("Saved transparent image to", out_path)

remove_black_background("frontend/public/rajasthan-guard.jpg", "frontend/public/rajasthan-guard-transparent.png")
