"""Cloudinary integration service for Bharat Gatha.

Provides helper utilities for configuring Cloudinary, uploading images and audio files,
and retrieving CDN-hosted asset URLs.
"""

import os
import re
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()


def configure_cloudinary():
    """Configure the Cloudinary SDK using CLOUDINARY_URL from environment."""
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    if not cloudinary_url:
        raise ValueError("CLOUDINARY_URL is not configured in .env")

    match = re.match(r"cloudinary://([^:]+):([^@]+)@(.+)", cloudinary_url)
    if match:
        api_key, api_secret, cloud_name = match.groups()
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
    return cloudinary.config()


def upload_file_to_cloudinary(file_path: str, folder: str = "bharat_gatha", resource_type: str = "auto") -> dict:
    """Upload a local image or audio file to Cloudinary into the specified folder.

    Args:
        file_path (str): Absolute or relative local path to the asset file.
        folder (str): Cloudinary destination folder (e.g. 'bharat_gatha/images').
        resource_type (str): 'image', 'video' (for audio/video), 'raw', or 'auto'.

    Returns:
        dict: Cloudinary upload response containing 'secure_url', 'public_id', etc.
    """
    configure_cloudinary()
    
    filename = os.path.basename(file_path)
    name_without_ext, _ = os.path.splitext(filename)

    response = cloudinary.uploader.upload(
        file_path,
        folder=folder,
        public_id=name_without_ext,
        use_filename=True,
        unique_filename=False,
        overwrite=True,
        resource_type=resource_type
    )
    return response
