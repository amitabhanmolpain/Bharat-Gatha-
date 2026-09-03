"""Sarvam AI Text-to-Speech (TTS) service for Bharat Gatha.

Handles interaction with the Sarvam AI Bulbul TTS API to synthesize
cinematic historical narration audio without exposing credentials to the client.
"""

import os
import requests

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"


def generate_tts_narration(
    text: str,
    speaker: str = "ratan",
    pace: float = 0.90,
    language_code: str = "en-IN",
    model: str = "bulbul:v3"
) -> dict:
    """Synthesize voice narration audio using Sarvam AI Bulbul TTS.

    Args:
        text (str): Narrative text to synthesize.
        speaker (str): Voice identity (default 'ratan').
        pace (float): Pacing speed (default 0.90 for cinematic historical narration).
        language_code (str): Language code (default 'en-IN').
        model (str): Model name (default 'bulbul:v3').

    Returns:
        dict: Result containing status and audio_base64 string or error message.
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

    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    # Bulbul v3 accepts inputs, target_language_code, speaker, pace, speech_sample_rate, model
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

        return {
            "status": "success",
            "audio_base64": audios[0],
            "format": "wav",
            "speaker": speaker,
            "pace": pace,
            "model": model,
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
