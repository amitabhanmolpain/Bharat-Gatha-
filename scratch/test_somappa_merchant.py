import sys
import os
import requests
import json
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/app/services")))
from parler_tts_service import CHARACTER_VOICE_PROFILES, clean_text_for_speech

PARLER_SPACE_BASE = "https://ai4bharat-indic-parler-tts.hf.space"
TARGET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/public/audio_cache"))

text = "Ramayya believed gold and stone fade over time, but written records and culture last forever. Inspect Kallappa's wooden toys to learn more."
clean_text = clean_text_for_speech(text)
profile = CHARACTER_VOICE_PROFILES["somappa"]
dest_path = os.path.join(TARGET_DIR, "somappa_merchant.wav")

print("Clean text:", clean_text)
call_url = f"{PARLER_SPACE_BASE}/gradio_api/call/generate_base"
call_res = requests.post(call_url, json={"data": [clean_text, profile["description"]]}, timeout=10)
print("Call res:", call_res.status_code, call_res.text)
event_id = call_res.json().get("event_id")
stream_url = f"{PARLER_SPACE_BASE}/gradio_api/call/generate_base/{event_id}"
stream_res = requests.get(stream_url, timeout=30)
print("Stream res text:", stream_res.text)
for line in stream_res.text.strip().split("\n"):
    if line.startswith("data:"):
        try:
            data = json.loads(line[5:].strip())
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                file_path = data[0].get("path")
                if file_path:
                    audio_res = requests.get(f"{PARLER_SPACE_BASE}/gradio_api/file={file_path}", timeout=20)
                    if audio_res.status_code == 200:
                        with open(dest_path, "wb") as f:
                            f.write(audio_res.content)
                        print("Successfully saved somappa_merchant.wav, size:", len(audio_res.content))
        except Exception as e:
            print("Error parsing data line:", e)
