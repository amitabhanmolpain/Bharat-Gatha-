"""Sprite transparency processing utility for genie assets."""

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
        # Check if pixel is white or very close to white
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")


if __name__ == "__main__":
    make_transparent("/Users/aniruddhapain/.gemini/antigravity/brain/8fb789ad-270c-4b5f-b551-d4c6b3359775/genie_rajasthani_1788278515732.jpg", "frontend/public/genie_rajasthani_transparent.png")
