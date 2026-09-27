const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');

const input = path.join(__dirname, 'public', 'anegundi_music.mp3');
const output = path.join(__dirname, 'public', 'anegundi_music_2m.mp3');

console.log("Cutting audio to 2 minutes...");
execSync(`"${ffmpeg}" -y -i "${input}" -t 00:02:00 -c copy "${output}"`, { stdio: 'inherit' });

const fs = require('fs');
fs.renameSync(output, input);
console.log("Done!");
