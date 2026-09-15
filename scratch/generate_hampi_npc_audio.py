import sys
import os
import requests
import json
import base64
from pathlib import Path

# Add backend service to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/app/services")))
from parler_tts_service import CHARACTER_VOICE_PROFILES, clean_text_for_speech

PARLER_SPACE_BASE = "https://ai4bharat-indic-parler-tts.hf.space"
TARGET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/public/audio_cache"))
os.makedirs(TARGET_DIR, exist_ok=True)

ITEMS = [
    {
        "filename": "kallappa_primary.wav",
        "character": "kallappa",
        "text": "Namaskara! Every toy on these shelves is hand-carved from seasoned wood and coated with natural mineral lacquer from Kinhal."
    },
    {
        "filename": "kallappa_full.wav",
        "character": "kallappa",
        "text": "Namaskara! Every toy on these shelves is hand-carved from seasoned wood and coated with natural mineral lacquer from Kinhal. You ask of Merchant Ramayya? Yes, he was my dearest childhood friend. Shortly before he vanished, he spent hours in my workshop, admiring these very pieces and carving intricate marks into their bases. Feel free to inspect them closely upon my workbench!"
    },
    {
        "filename": "somappa_gems.wav",
        "character": "somappa",
        "text": "Welcome, traveler! Nowhere under heaven will you behold wealth like ours. We measure diamonds from Kollur, pearls from the Persian Gulf, and Ceylon rubies by the dry measure like sesame seeds! Ask me what you wish of our commerce, or of the strange rumors stirring our market colonnades."
    },
    {
        "filename": "somappa_rumor.wav",
        "character": "somappa",
        "text": "Ramayya the Scribe-Merchant managed royal accounts. He feared our records might be lost one day, so he hid three ledger fragments. He left the first clue with his friend Master Kallappa, the toymaker."
    },
    {
        "filename": "somappa_merchant.wav",
        "character": "somappa",
        "text": "Ramayya believed gold and stone fade over time, but written records and culture last forever. Inspect Kallappa's wooden toys to learn more."
    }
]

def generate_and_save(item):
    filename = item["filename"]
    dest_path = os.path.join(TARGET_DIR, filename)
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        print(f"Already exists: {filename} ({os.path.getsize(dest_path)} bytes)")
        return True

    profile = CHARACTER_VOICE_PROFILES[item["character"]]
    clean_text = clean_text_for_speech(item["text"])
    description = profile["description"]

    print(f"Synthesizing {filename} for {profile['name']} via Indic Parler-TTS...")
    call_url = f"{PARLER_SPACE_BASE}/gradio_api/call/generate_base"
    payload = {"data": [clean_text, description]}

    try:
        call_res = requests.post(call_url, json=payload, timeout=10)
        if call_res.status_code != 200:
            print(f"Error calling Parler space: {call_res.status_code}")
            return False

        event_id = call_res.json().get("event_id")
        if not event_id:
            print("No event_id returned")
            return False

        stream_url = f"{PARLER_SPACE_BASE}/gradio_api/call/generate_base/{event_id}"
        stream_res = requests.get(stream_url, timeout=30)
        
        file_path = None
        for line in stream_res.text.strip().split("\n"):
            if line.startswith("data:"):
                try:
                    data = json.loads(line[5:].strip())
                    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                        file_path = data[0].get("path")
                except Exception:
                    pass

        if not file_path:
            print(f"Could not extract file_path from stream response: {stream_res.text[:200]}")
            return False

        audio_download_url = f"{PARLER_SPACE_BASE}/gradio_api/file={file_path}"
        audio_res = requests.get(audio_download_url, timeout=20)
        if audio_res.status_code == 200 and len(audio_res.content) > 1000:
            with open(dest_path, "wb") as f:
                f.write(audio_res.content)
            print(f"Successfully saved {filename} ({len(audio_res.content)} bytes)")
            return True
        else:
            print(f"Failed to download audio: status {audio_res.status_code}")
            return False
    except Exception as e:
        print(f"Exception during synthesis of {filename}: {e}")
        return False

for item in ITEMS:
    generate_and_save(item)

print("Batch generation completed.")
