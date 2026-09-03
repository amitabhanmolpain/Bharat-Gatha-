"""TTS controller for Bharat Gatha narration endpoints.

Dispatches speech synthesis requests to the TTS service and returns
the audio payload to the frontend game client.
"""

from flask import Blueprint, jsonify, request
from app.services.tts_service import generate_tts_narration

tts_bp = Blueprint('tts', __name__)


@tts_bp.route('/narrate', methods=['POST'])
def narrate():
    """Synthesize voice narration using Sarvam AI Bulbul TTS.

    Expected JSON payload:
        text (str): Narrative text to synthesize (required).
        speaker (str, optional): Voice name (default: 'ratan').
        pace (float, optional): Speed multiplier (default: 0.90).
        language_code (str, optional): Language code (default: 'en-IN').
        model (str, optional): Model identifier (default: 'bulbul:v3').

    Returns:
        JSON response with audio_base64 and synthesis metadata.
    """
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    speaker = data.get("speaker", "ratan")
    pace = data.get("pace", 0.90)
    language_code = data.get("language_code", "en-IN")
    model = data.get("model", "bulbul:v3")

    result = generate_tts_narration(
        text=text,
        speaker=speaker,
        pace=pace,
        language_code=language_code,
        model=model
    )

    status_code = result.pop("status_code", 200)
    return jsonify(result), status_code
