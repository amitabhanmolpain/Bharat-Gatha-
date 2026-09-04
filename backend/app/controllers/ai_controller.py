"""AI Controller for Bharat Gatha Groq Ask Question & LangChain AI Agents.

Exposes REST API endpoints for in-game historical inquiries using:
- LangChain Genie Agent (Jolly Bhai) with calm, wise historical storytelling.
- LangChain Guard Agent (Amar Singh Gate Sentry) with fierce, angry sentry guardrails.
- Groq AI 'openai/gpt-oss-120b' LLM engine with era-aware context.
"""

from flask import Blueprint, jsonify, request
from app.services.groq_service import ask_historical_question
from app.agents import ask_genie_agent, ask_guard_agent, CAMPAIGN_REGISTRY
from app.services.parler_tts_service import generate_character_speech

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/ask', methods=['POST'])
def ask_question():
    """Handle in-game player historical questions using Groq AI / LangChain Agents.

    Expected JSON body:
        question (str): Player's historical question (required).
        character (str, optional): 'jolly', 'guard', or general.
        context (dict, optional): Current era, location, year, ruler, etc.
        model (str, optional): Groq model ID (default: 'openai/gpt-oss-120b').

    Returns:
        JSON response with the historical answer, context, and character audio.
    """
    data = request.get_json(silent=True) or {}
    question = data.get("question", "")
    character = data.get("character", "jolly").lower()
    context = data.get("context", {})
    model = data.get("model", "openai/gpt-oss-120b")

    if character in ("guard", "sentry"):
        result = ask_guard_agent(
            question=question,
            context=context,
            model_name=model
        )
    elif character in ("jolly", "genie"):
        result = ask_genie_agent(
            question=question,
            context=context,
            model_name=model
        )
    else:
        result = ask_historical_question(
            question=question,
            context=context,
            model=model
        )

    status_code = result.pop("status_code", 200)
    return jsonify(result), status_code


@ai_bp.route('/genie/chat', methods=['POST'])
def genie_chat():
    """Dedicated endpoint for LangChain Genie (Jolly Bhai) AI Agent interactions."""
    data = request.get_json(silent=True) or {}
    question = data.get("question", "")
    context = data.get("context", {})
    model = data.get("model", "openai/gpt-oss-120b")

    result = ask_genie_agent(
        question=question,
        context=context,
        model_name=model
    )

    status_code = result.pop("status_code", 200)
    return jsonify(result), status_code


@ai_bp.route('/genie/campaigns', methods=['GET'])
def get_genie_campaigns():
    """Return all supported Bharat Gatha campaigns and historical metadata for Jolly Bhai."""
    return jsonify({
        "status": "success",
        "character": "jolly",
        "character_name": "Jolly Bhai",
        "campaigns": CAMPAIGN_REGISTRY
    }), 200


@ai_bp.route('/guard/chat', methods=['POST'])
def guard_chat():
    """Dedicated endpoint for LangChain Mughal Guard (Amar Singh Gate Sentry) AI Agent."""
    data = request.get_json(silent=True) or {}
    question = data.get("question", "")
    context = data.get("context", {})
    model = data.get("model", "openai/gpt-oss-120b")

    result = ask_guard_agent(
        question=question,
        context=context,
        model_name=model
    )

    status_code = result.pop("status_code", 200)
    return jsonify(result), status_code


@ai_bp.route('/scenario/objective', methods=['GET', 'POST'])
def get_scenario_objective():
    """Return dynamic scenario objectives based on current era, scene, and progression."""
    data = request.get_json(silent=True) or {}
    scene = data.get("scene") or request.args.get("scene", "gate")
    clues_found = int(data.get("clues_found") or request.args.get("clues_found", 0))

    objectives = {
        "gate": (
            "Go talk with the guard at Amar Singh Gate."
            if clues_found == 0
            else "You have to find your companion. Walk through the passage toward the Diwan-i-Khas."
        ),
        "passage": "You have to find your companion. Ascend the royal ramp towards the Elephant Gate (Hathi Pol).",
        "courtyard": "You have to find your companion. Search the royal courtyard and enter the Diwan-i-Aam or palace galleries.",
        "interior": "Inspect the imperial throne and search for your companion, then proceed to the Sheesh Mahal corridor.",
        "sheesh_passage": "Follow the royal marble corridor towards the Sheesh Mahal to track your companion.",
        "sheesh_mahal": "Examine the central marble fountain and mirror arches to find traces of your companion.",
        "brown_passage": "Proceed through the carved sandstone gallery towards Khas Mahal to locate your companion.",
        "khas_mahal": "Inspect the river terrace overlooking the Yamuna for signs of your companion, then cross the river.",
        "taj_gate": "Approach the Great Gate (Darwaza-i-Rauza) and solve the calligraphy puzzle to track your companion.",
        "taj_charbagh": "Cross the Persian Charbagh gardens towards the central lotus pool to track your companion.",
        "taj_exterior": "Ascend the marble terrace and enter the Taj Mahal Mausoleum to search for your companion.",
        "taj_mausoleum": "Search the central octagonal marble chamber for clues of your companion's trail.",
        "taj_mehtab_bagh": "Explore Mehtab Bagh and talk to the Caretaker Archaeologist to locate your companion.",
        "red_fort_plaza": "Enter through the Lahori Gate of the Red Fort in Old Delhi to track your companion.",
        "red_fort_interior": "Explore the covered Chatta Chowk bazaar towards the imperial Diwan-i-Khas."
    }

    return jsonify({
        "status": "success",
        "scene": scene,
        "clues_found": clues_found,
        "objective": objectives.get(scene, "Explore the historical era to uncover clues about your companion.")
    })

