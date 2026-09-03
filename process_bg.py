"""Image asset background processing utility.

Converts dark background pixels in sprite assets into transparent PNG format.
Accepts input and output paths via CLI arguments.
"""

import argparse
import os
from PIL import Image


def remove_black_background(img_path: str, out_path: str) -> None:
    """Remove near-black background pixels from an image and save as transparent PNG.

    Args:
        img_path (str): The file path to the source image.
        out_path (str): The destination file path where the PNG will be saved.

    Returns:
        None
    """
    if not os.path.exists(img_path):
        print(f"Warning: Input file '{img_path}' not found. Skipping.")
        return

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
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    img.save(out_path, "PNG")
    print("Saved transparent image to", out_path)


def main() -> None:
    """Parse command-line arguments and remove dark background from input image."""
    parser = argparse.ArgumentParser(description="Remove black background from sprite image.")
    parser.add_argument("-i", "--input", help="Path to input image file.")
    parser.add_argument("-o", "--output", help="Path to output PNG image file.")
    args = parser.parse_args()

    if args.input and args.output:
        remove_black_background(args.input, args.output)
    else:
        default_in = "frontend/public/rajasthan-guard.jpg"
        default_out = "frontend/public/rajasthan-guard-transparent.png"
        if os.path.exists(default_in):
            remove_black_background(default_in, default_out)


if __name__ == "__main__":
    main()
