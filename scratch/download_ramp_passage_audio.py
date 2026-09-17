import os
import sys
import shutil
import imageio_ffmpeg
import yt_dlp

ffmpeg_src = imageio_ffmpeg.get_ffmpeg_exe()
bin_dir = os.path.dirname(ffmpeg_src)
ffmpeg_target = os.path.join(bin_dir, "ffmpeg.exe")
if not os.path.exists(ffmpeg_target):
    shutil.copyfile(ffmpeg_src, ffmpeg_target)
    print(f"Copied {ffmpeg_src} -> {ffmpeg_target}")

os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")
print(f"Using ffmpeg in directory: {bin_dir}, exe: {ffmpeg_target}")

url = "https://www.youtube.com/watch?v=30sCS6_2CL4"
output_path = os.path.join(os.getcwd(), "frontend", "public", "ramp_passage_theme")

ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': output_path + '.%(ext)s',
    'ffmpeg_location': bin_dir,

    'download_ranges': yt_dlp.utils.download_range_func(None, [(0, 150)]),
    'force_keyframes_at_cuts': True,
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'noplaylist': True,
}

print("Starting download of ramp passage music...")
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download([url])

print("Download complete!")
