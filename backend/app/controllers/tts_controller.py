"""TTS controller for Bharat Gatha narration and character voice endpoints.

Dispatches speech synthesis requests to:
- Sarvam AI TTS (for main historical narrator)
- Indic Parler-TTS (for Jolly Bhai and Mughal Guards)
"""

from flask import Blueprint, jsonify, request
from app.services.tts_service import generate_tts_narration
from app.services.parler_tts_service import generate_character_speech, CHARACTER_VOICE_PROFILES

tts_bp = Blueprint('tts', __name__)


@tts_bp.route('/narrate', methods=['POST'])
def narrate():
    """Synthesize voice narration using Sarvam AI Bulbul TTS (Narrator voice)."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    speaker = data.get("speaker", "ratan")
    pace = data.get("pace", 0.88)
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


@tts_bp.route('/character', methods=['POST'])
def character_speech():
    """Synthesize character dialogue using Indic Parler-TTS voice profile.

    Expected JSON body:
        character (str): 'jolly', 'guard', etc. (required).
        text (str): Dialogue text (required).

    Returns:
        JSON response with audio payload and character metadata.
    """
    data = request.get_json(silent=True) or {}
    character = data.get("character", "jolly")
    text = data.get("text", "")

    result = generate_character_speech(
        character=character,
        text=text
    )

    status_code = result.pop("status_code", 200)
    return jsonify(result), status_code


@tts_bp.route('/characters', methods=['GET'])
def list_character_profiles():
    """Return all registered character voice profiles for Indic Parler-TTS."""
    return jsonify({
        "status": "success",
        "profiles": CHARACTER_VOICE_PROFILES
    }), 200
