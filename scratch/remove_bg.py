"""Sprite transparency processing utility for merchant silk and jewels."""

from PIL import Image


def make_transparent(input_path, output_path):
    """Convert near-white background pixels in an image to alpha transparency.

    Args:
        input_path (str): File path to input image.
        output_path (str): File path to save output transparent PNG.

    Returns:
        None
    """
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


if __name__ == "__main__":
    make_transparent("frontend/public/trader_silk.jpg", "frontend/public/trader_silk_transparent.png")
    make_transparent("frontend/public/trader_jewels.jpg", "frontend/public/trader_jewels_transparent.png")
