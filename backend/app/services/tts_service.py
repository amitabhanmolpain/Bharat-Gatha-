"""Sarvam AI Text-to-Speech (TTS) service for Bharat Gatha.

Handles interaction with the Sarvam AI Bulbul TTS API to synthesize
cinematic historical narration audio without exposing credentials to the client.
"""

import os
import base64
import hashlib
import requests

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# Local directory to download and persist every Sarvam TTS audio
AUDIO_CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/audio_cache"))
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)


def generate_tts_narration(
    text: str,
    speaker: str = "ratan",
    pace: float = 0.90,
    language_code: str = "en-IN",
    model: str = "bulbul:v3"
) -> dict:
    """Synthesize voice narration audio using Sarvam AI Bulbul TTS.
    
    Automatically downloads and caches the resulting .wav audio locally in 
    frontend/public/audio_cache/ so it can be served instantly offline without repeated API calls.
    """
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        return {
            "status": "error",
            "message": "SARVAM_API_KEY is not configured in backend environment.",
            "status_code": 500
        }

    clean_text = text.strip() if text else ""
    if not clean_text:
        return {
            "status": "error",
            "message": "Missing 'text' field for narration synthesis.",
            "status_code": 400
        }

    # 1. Check local persistent audio disk cache
    cache_key = hashlib.md5(f"{clean_text}_{speaker}_{pace}_{language_code}_{model}".encode('utf-8')).hexdigest()
    cached_filename = f"sarvam_{cache_key}.wav"
    cached_filepath = os.path.join(AUDIO_CACHE_DIR, cached_filename)

    if os.path.exists(cached_filepath) and os.path.getsize(cached_filepath) > 100:
        try:
            with open(cached_filepath, "rb") as f:
                b64_data = base64.b64encode(f.read()).decode('utf-8')
            return {
                "status": "success",
                "audio_base64": b64_data,
                "audio_url": f"/audio_cache/{cached_filename}",
                "format": "wav",
                "speaker": speaker,
                "pace": pace,
                "cached": True,
                "status_code": 200
            }
        except Exception:
            pass

    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": [clean_text],
        "target_language_code": language_code,
        "speaker": speaker,
        "pace": float(pace),
        "speech_sample_rate": 22050,
        "enable_preprocessing": True,
        "model": model
    }

    try:
        response = requests.post(SARVAM_TTS_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            return {
                "status": "error",
                "message": f"Sarvam API Error ({response.status_code}): {response.text}",
                "status_code": response.status_code
            }

        res_json = response.json()
        audios = res_json.get("audios", [])

        if not audios or not audios[0]:
            return {
                "status": "error",
                "message": "No audio returned from Sarvam TTS service.",
                "status_code": 502
            }

        audio_b64 = audios[0]

        # 2. Download and persist to local disk cache
        try:
            with open(cached_filepath, "wb") as f:
                f.write(base64.b64decode(audio_b64))
        except Exception as save_err:
            print("Failed to write to local audio cache:", save_err)

        return {
            "status": "success",
            "audio_base64": audio_b64,
            "audio_url": f"/audio_cache/{cached_filename}",
            "format": "wav",
            "speaker": speaker,
            "pace": pace,
            "model": model,
            "cached": False,
            "status_code": 200
        }

    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "message": "Request to Sarvam TTS API timed out.",
            "status_code": 504
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"An unexpected error occurred during narration synthesis: {str(e)}",
            "status_code": 500
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"An unexpected error occurred during narration synthesis: {str(e)}",
            "status_code": 500
        }
