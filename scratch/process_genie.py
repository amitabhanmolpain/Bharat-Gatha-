"""Sprite transparency processing utility for genie assets.

Accepts input and output image paths via CLI arguments to convert
background pixels into transparency.
"""

import argparse
import os
from PIL import Image


def make_transparent(input_path: str, output_path: str) -> None:
    """Convert near-white background pixels in an image to alpha transparency.

    Args:
        input_path (str): File path to input image.
        output_path (str): File path to save output transparent PNG.

    Returns:
        None
    """
    if not os.path.exists(input_path):
        print(f"Warning: Input file '{input_path}' not found. Skipping.")
        return

    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to open '{input_path}': {e}")
        return

    data = img.getdata()
    
    newData = []
    for item in data:
        # Check if pixel is white or very close to white
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")


def main() -> None:
    """Parse command-line arguments and process images."""
    parser = argparse.ArgumentParser(description="Convert white image backgrounds to transparency.")
    parser.add_argument("-i", "--input", help="Path to input image file.")
    parser.add_argument("-o", "--output", help="Path to output PNG image file.")
    args = parser.parse_args()

    if args.input and args.output:
        make_transparent(args.input, args.output)
    else:
        # Default fallback if genie file exists locally in frontend/public
        default_in = "frontend/public/genie_rajasthani.jpg"
        default_out = "frontend/public/genie_rajasthani_transparent.png"
        if os.path.exists(default_in):
            make_transparent(default_in, default_out)


if __name__ == "__main__":
    main()
