"""Image asset background processing utility.

Converts dark background pixels in sprite assets into transparent PNG format.
"""

from PIL import Image


def remove_black_background(img_path, out_path):
    """Remove near-black background pixels from an image and save as transparent PNG.

    Args:
        img_path (str): The file path to the source image.
        out_path (str): The destination file path where the PNG will be saved.

    Returns:
        None
    """
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


if __name__ == "__main__":
    remove_black_background("frontend/public/rajasthan-guard.jpg", "frontend/public/rajasthan-guard-transparent.png")
