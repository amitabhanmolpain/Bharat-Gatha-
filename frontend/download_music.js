const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

try {
  // Delete old temp files if any
  const oldFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('temp_audio.'));
  for (const f of oldFiles) {
    if (/^temp_audio\.[a-z0-9]+$/i.test(f)) {
      fs.unlinkSync(path.join(__dirname, f));
    }
  }

  console.log("Downloading audio with yt-dlp...");
  execSync('python -m yt_dlp -f bestaudio -o "temp_audio.%(ext)s" https://www.youtube.com/watch?v=UWrWwbNBZ6Q', { stdio: 'inherit' });

  const files = fs.readdirSync('.');
  const audioFile = files.find(f => f.startsWith('temp_audio.'));

  console.log("Found downloaded file:", audioFile);
  console.log("Cutting audio from 2:00 to 4:10 and converting to mp3...");
  const output = path.join(__dirname, 'public', 'vijayanagara_music.mp3');
  
  // Convert and slice. We don't use -c:v copy since it's audio. We can just encode to mp3 or use copy if it's m4a. 
  // MP3 is safer for browser playback.
  execSync(`"${ffmpeg}" -y -i "${audioFile}" -ss 00:02:00 -to 00:04:10 -c:a libmp3lame -q:a 2 "${output}"`, { stdio: 'inherit' });

  console.log("Done! Cleaning up...");
  if (/^temp_audio\.[a-z0-9]+$/i.test(audioFile)) {
    fs.unlinkSync(path.join(__dirname, audioFile));
  }
  
} catch (e) {
  console.error("Error:", e);
}
