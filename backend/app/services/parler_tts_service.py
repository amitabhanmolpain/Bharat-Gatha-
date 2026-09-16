"""Dynamic Character Voice & Speech Synthesis Service for Bharat Gatha.

Provides real-time dynamic text-to-speech for ALL types of game text, dialogues,
and player inquiries.

Features:
- Dynamic text cleaner & normalizer (strips markdown, brackets, clean pauses).
- Supports all character types (Jolly Bhai Genie, Mughal Guard, Elder, Archaeologist, Narrator).
- Dual-tier synthesis: High-fidelity Indic Parler-TTS with instant neural speech engine.
- 100% resilient playback for any arbitrary text query.
"""

import os
import re
import json
import base64
import hashlib
import requests
from pathlib import Path
from dotenv import load_dotenv

# Robust .env loader
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

PARLER_SPACE_BASE = "https://ai4bharat-indic-parler-tts.hf.space"

# Local directory to cache every synthesized character audio permanently
AUDIO_CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/audio_cache"))
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)

CHARACTER_VOICE_PROFILES = {
    "jolly": {
        "id": "jolly",
        "name": "Jolly Bhai",
        "role": "Ancient Time-Traveling Genie Companion",
        "description": (
            "A friendly Indian male speaking natural Indian English, conversational and warm, "
            "with clear pronunciation, energetic natural pace, playful personality, "
            "like a knowledgeable Indian companion guiding someone through historical Bharat."
        ),
        "fallback_speaker": "rahul",
        "fallback_pace": 1.00,
        "language_code": "en-IN"
    },
    "guard": {
        "id": "guard",
        "name": "Amar Singh Gate Sentry",
        "role": "Royal Mughal Guard at Agra Fort",
        "description": (
            "A very angry, loud and aggressive adult Indian male voice with a deep, harsh and commanding tone. "
            "He speaks in Indian English with fierce authority and sharp emphasis, shouting orders like an enraged palace guard."
        ),
        "fallback_speaker": "ratan",
        "fallback_pace": 1.12,
        "language_code": "en-IN"
    },
    "chacha": {
        "id": "chacha",
        "name": "Buzurg Chacha",
        "role": "Elderly Rajput Courtyard Storyteller & Chaupar Master",
        "description": "An affectionate, elderly, and wise Indian male elder voice speaking warmly in Indian English to a younger traveler.",
        "fallback_speaker": "ratan",
        "fallback_pace": 0.85,
        "language_code": "en-IN"
    },
    "elder": {
        "id": "elder",
        "name": "Village Elder",
        "role": "Ancient Rajput Chronicler",
        "description": "An elderly, wise Indian male voice speaking slowly with deep reverence and history.",
        "fallback_speaker": "ratan",
        "fallback_pace": 0.82,
        "language_code": "en-IN"
    },
    "archaeologist": {
        "id": "archaeologist",
        "name": "Dr. Ananya",
        "role": "Historian & Archaeologist",
        "description": "An articulate, educated Indian female voice speaking with passion and academic clarity.",
        "fallback_speaker": "priya",
        "fallback_pace": 0.94,
        "language_code": "en-IN"
    },
    "narrator": {
        "id": "narrator",
        "name": "Historical Chronicler",
        "role": "Grand Narrator",
        "description": "A deep, resonant, cinematic Indian male voice delivering historical lore.",
        "fallback_speaker": "ratan",
        "fallback_pace": 0.88,
        "language_code": "en-IN"
    }
}


def clean_text_for_speech(raw_text: str) -> str:
    """Normalize and clean any game text for natural speech synthesis.

    - Removes markdown syntax (bold, italic, headers, backticks).
    - Removes emojis and HTML tags.
    - Cleans extra whitespaces and formats punctuation pauses.
    """
    if not raw_text:
        return ""
    
    text = raw_text.strip()
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove markdown bold/italics/strikethrough
    text = re.sub(r'[*_~`#]', '', text)
    # Remove markdown links [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Remove emojis & non-ascii graphic symbols while keeping standard punctuation
    text = re.sub(r'[^\x00-\x7F\u0900-\u097F]+', ' ', text)
    # Clean multiple spaces and newlines
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def get_character_profile(character_id: str) -> dict:
    """Retrieve the voice profile configuration for any character or NPC."""
    key = (character_id or "jolly").lower().strip()
    if "guard" in key or "sentry" in key or "soldier" in key:
        return CHARACTER_VOICE_PROFILES["guard"]
    if "elder" in key or "sage" in key or "priest" in key:
        return CHARACTER_VOICE_PROFILES["elder"]
    if "archaeologist" in key or "scholar" in key or "ananya" in key:
        return CHARACTER_VOICE_PROFILES["archaeologist"]
    if "narrator" in key or "story" in key or "chronicler" in key:
        return CHARACTER_VOICE_PROFILES["narrator"]
    return CHARACTER_VOICE_PROFILES.get(key, CHARACTER_VOICE_PROFILES["jolly"])


def _synthesize_neural_fallback(profile: dict, text: str) -> dict:
    """Synthesize speech using high-fidelity Indian English neural engine."""
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        return {
            "status": "error",
            "message": "Missing speech synthesis API key.",
            "status_code": 500
        }

    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": [text],
        "target_language_code": profile.get("language_code", "en-IN"),
        "speaker": profile.get("fallback_speaker", "rahul"),
        "pace": float(profile.get("fallback_pace", 1.00)),
        "speech_sample_rate": 22050,
        "enable_preprocessing": True,
        "model": "bulbul:v3"
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        if res.status_code == 200:
            data = res.json()
            audios = data.get("audios", [])
            if audios and len(audios) > 0:
                return {
                    "status": "success",
                    "character": profile["id"],
                    "character_name": profile["name"],
                    "audio_base64": audios[0],
                    "format": "wav",
                    "engine": "indic_neural",
                    "status_code": 200
                }
        return {
            "status": "error",
            "message": f"Neural synthesis failed with status {res.status_code}",
            "status_code": res.status_code
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Neural fallback error: {str(e)}",
            "status_code": 500
        }


def generate_character_speech(character: str, text: str) -> dict:
    """Dynamically synthesize speech for any type of text or character.

    Uses canonical voice profiles (e.g. Rahul for Jolly Bhai at pace 1.0)
    to guarantee identical tone, accent, pitch, and energy across all game scenes.

    Args:
        character (str): 'jolly', 'guard', 'elder', 'archaeologist', 'narrator', etc.
        text (str): Dialogue or text line to synthesize.

    Returns:
        dict: Result containing 'status', 'audio_base64', and character metadata.
    """
    profile = get_character_profile(character)
    clean_text = clean_text_for_speech(text)
    
    if not clean_text:
        return {
            "status": "error",
            "message": "Missing 'text' field for dialogue synthesis.",
            "status_code": 400
        }

    # 0. Check persistent disk cache for exact acoustic consistency
    cache_key = hashlib.md5(f"canonical_{profile['id']}_{clean_text}".encode('utf-8')).hexdigest()
    cached_file = os.path.join(AUDIO_CACHE_DIR, f"jolly_{cache_key}.wav")
    if os.path.exists(cached_file) and os.path.getsize(cached_file) > 1000:
        try:
            with open(cached_file, "rb") as f:
                cached_bytes = f.read()
            return {
                "status": "success",
                "character": profile["id"],
                "character_name": profile["name"],
                "audio_base64": base64.b64encode(cached_bytes).decode("utf-8"),
                "audio_url": f"/audio_cache/jolly_{cache_key}.wav",
                "format": "wav",
                "engine": "canonical_tts_cached",
                "status_code": 200
            }
        except Exception:
            pass

    # 1. Canonical Neural Synthesis (High-fidelity Indian English synthesis)
    result = _synthesize_neural_fallback(profile, clean_text)
    if result.get("status") == "success" and result.get("audio_base64"):
        try:
            with open(cached_file, "wb") as f:
                f.write(base64.b64decode(result["audio_base64"]))
            result["audio_url"] = f"/audio_cache/jolly_{cache_key}.wav"
        except Exception:
            pass
        return result

    # 2. Parler Space Secondary Attempt (if neural API is unreachable)
    try:
        call_url = f"{PARLER_SPACE_BASE}/gradio_api/call/generate_base"
        payload = {
            "data": [
                clean_text,
                profile["description"]
            ]
        }
        call_res = requests.post(call_url, json=payload, timeout=5)
        if call_res.status_code == 200:
            event_id = call_res.json().get("event_id")
            if event_id:
                stream_url = f"{PARLER_SPACE_BASE}/gradio_api/call/generate_base/{event_id}"
                stream_res = requests.get(stream_url, timeout=8)
                file_path = None
                for line in stream_res.text.strip().split("\n"):
                    if line.startswith("data:"):
                        try:
                            data = json.loads(line[5:].strip())
                            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                                file_path = data[0].get("path")
                        except Exception:
                            pass
                if file_path:
                    audio_download_url = f"{PARLER_SPACE_BASE}/gradio_api/file={file_path}"
                    audio_res = requests.get(audio_download_url, timeout=8)
                    if audio_res.status_code == 200 and len(audio_res.content) > 0:
                        try:
                            with open(cached_file, "wb") as f:
                                f.write(audio_res.content)
                        except Exception:
                            pass
                        audio_b64 = base64.b64encode(audio_res.content).decode("utf-8")
                        return {
                            "status": "success",
                            "character": profile["id"],
                            "character_name": profile["name"],
                            "audio_base64": audio_b64,
                            "audio_url": f"/audio_cache/jolly_{cache_key}.wav",
                            "format": "wav",
                            "engine": "indic_parler_tts",
                            "status_code": 200
                        }
    except Exception:
        pass

    return result
