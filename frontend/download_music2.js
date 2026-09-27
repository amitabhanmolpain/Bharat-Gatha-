const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

try {
  // Delete old temp files if any
  const oldFiles = fs.readdirSync('.').filter(f => f.startsWith('temp_audio2.'));
  for (const f of oldFiles) fs.unlinkSync(f);

  console.log("Downloading audio with yt-dlp...");
  execSync('python -m yt_dlp -f bestaudio -o "temp_audio2.%(ext)s" https://www.youtube.com/watch?v=UZ9uyQI3pF0', { stdio: 'inherit' });

  const files = fs.readdirSync('.');
  const audioFile = files.find(f => f.startsWith('temp_audio2.'));

  console.log("Found downloaded file:", audioFile);
  console.log("Converting to mp3 (first 5 minutes)...");
  const output = path.join(__dirname, 'public', 'anegundi_music.mp3');
  
  // Convert and slice the first 5 minutes just to keep the file size reasonable for web
  execSync(`"${ffmpeg}" -y -i "${audioFile}" -ss 00:00:00 -to 00:05:00 -c:a libmp3lame -q:a 2 "${output}"`, { stdio: 'inherit' });

  console.log("Done! Cleaning up...");
  fs.unlinkSync(audioFile);
  
} catch (e) {
  console.error("Error:", e);
}
