"""Batch asset uploader for Bharat Gatha.

Uploads all game images and audio files from the frontend/public folder
to Cloudinary under the 'bharat_gatha/images' and 'bharat_gatha/audio' folders,
and generates a CDN manifest mapping file.
"""

import os
import sys
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.services.cloudinary_service import upload_file_to_cloudinary, configure_cloudinary

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.ico'}
AUDIO_EXTENSIONS = {'.webm', '.mp3', '.wav', '.ogg', '.aac', '.m4a'}


def upload_single_asset(file_path: Path):
    ext = file_path.suffix.lower()
    filename = file_path.name

    if ext in IMAGE_EXTENSIONS:
        folder = "bharat_gatha/images"
        res_type = "image"
    elif ext in AUDIO_EXTENSIONS:
        folder = "bharat_gatha/audio"
        res_type = "video"  # Cloudinary uses 'video' resource type for audio streams (mp3, webm, wav)
    else:
        return None

    try:
        res = upload_file_to_cloudinary(str(file_path), folder=folder, resource_type=res_type)
        secure_url = res.get("secure_url")
        print(f"[OK] Uploaded ({res_type}): {filename} -> {secure_url}")
        return {
            "filename": filename,
            "type": res_type,
            "url": secure_url,
            "public_id": res.get("public_id"),
            "bytes": res.get("bytes")
        }
    except Exception as e:
        print(f"[ERROR] Failed to upload {filename}: {str(e)}")
        return {
            "filename": filename,
            "type": res_type,
            "error": str(e)
        }


def main():
    configure_cloudinary()
    
    public_dir = Path(r"c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public")
    if not public_dir.exists():
        print(f"Directory not found: {public_dir}")
        return

    files_to_upload = [
        p for p in public_dir.iterdir()
        if p.is_file() and p.suffix.lower() in (IMAGE_EXTENSIONS | AUDIO_EXTENSIONS)
    ]

    print(f"Found {len(files_to_upload)} asset files to upload to Cloudinary (Folder: 'bharat_gatha/')...\n")

    manifest = {}
    success_count = 0
    fail_count = 0

    # Upload in parallel with 6 concurrent workers
    with ThreadPoolExecutor(max_workers=6) as executor:
        future_to_file = {executor.submit(upload_single_asset, f): f for f in files_to_upload}
        for future in as_completed(future_to_file):
            result = future.result()
            if result:
                if "url" in result:
                    manifest[result["filename"]] = result["url"]
                    success_count += 1
                else:
                    fail_count += 1

    # Save manifest in backend and frontend
    backend_manifest_path = Path(r"c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\backend\app\config\cloudinary_assets.json")
    frontend_manifest_path = Path(r"c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\public\cloudinary_manifest.json")

    backend_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(backend_manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    with open(frontend_manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n==========================================")
    print(f"Upload Summary:")
    print(f"[OK] Successfully uploaded: {success_count} files")
    print(f"[ERR] Failed: {fail_count} files")
    print(f"Saved manifest to: {backend_manifest_path}")
    print(f"Saved manifest to: {frontend_manifest_path}")
    print(f"==========================================")


if __name__ == "__main__":
    main()
