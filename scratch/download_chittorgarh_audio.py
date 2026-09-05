import os
import sys
import imageio_ffmpeg
import yt_dlp

bin_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")
print(f"Using ffmpeg in directory: {bin_dir}")

url = "https://www.youtube.com/watch?v=j4yWeD_9-Eg"
output_path = os.path.join(os.getcwd(), "frontend", "public", "chittorgarh_theme")

ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': output_path + '.%(ext)s',
    'ffmpeg_location': bin_dir,
    'download_ranges': yt_dlp.utils.download_range_func(None, [(0, 120)]),
    'force_keyframes_at_cuts': True,
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'noplaylist': True,
}

print("Starting download of first 2 minutes...")
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download([url])

print("Download complete!")
