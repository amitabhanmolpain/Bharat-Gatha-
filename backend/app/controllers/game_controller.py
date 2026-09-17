"""Game progress and victory recording API controller.

Exposes REST endpoints to persist game victories, solved puzzles, and prizes
into MongoDB.
"""

from flask import Blueprint, request, jsonify
from app.models.game_win import GameWinModel

game_bp = Blueprint("game", __name__)


@game_bp.route("/win", methods=["POST"])
def record_win():
    """Record a puzzle or game victory as SOLVED in MongoDB."""
    try:
        data = request.get_json(silent=True) or {}
        if not data.get("game_type"):
            return jsonify({
                "success": False,
                "error": "Missing required field: game_type"
            }), 400

        record = GameWinModel.record_win(data)
        return jsonify({
            "success": True,
            "message": "Game marked as SOLVED in database successfully!",
            "win": record
        }), 201

    except Exception as e:
        print(f"[Record Win Error]: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@game_bp.route("/wins", methods=["GET"])
def get_wins():
    """Retrieve all recorded victories for a user."""
    try:
        user_id = request.args.get("user_id", "default_traveller")
        era = request.args.get("era", None)

        wins = GameWinModel.get_user_wins(user_id, era)
        return jsonify({
            "success": True,
            "user_id": user_id,
            "era": era,
            "total_wins": len(wins),
            "wins": wins
        }), 200

    except Exception as e:
        print(f"[Get Wins Error]: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@game_bp.route("/solved-status", methods=["GET"])
def get_solved_status():
    """Retrieve list of solved puzzles for a user from database."""
    try:
        user_id = request.args.get("user_id", "default_traveller")
        era = request.args.get("era", "mughal")

        solved_list = GameWinModel.get_solved_puzzles(user_id, era)
        return jsonify({
            "success": True,
            "user_id": user_id,
            "era": era,
            "solved_puzzles": solved_list,
            "is_pietra_dura_solved": "pietra_dura_flower_art" in solved_list,
            "is_sheesh_mirror_solved": "sheesh_mahal_reflection" in solved_list,
            "is_great_bath_drainage_solved": "great_bath_drainage" in solved_list,
            "is_steatite_seal_solved": "steatite_seal_decryption" in solved_list
        }), 200

    except Exception as e:
        print(f"[Get Solved Status Error]: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@game_bp.route("/checkpoint", methods=["POST"])
def save_checkpoint():
    """Persist the player's full milestone and exploration checkpoint in database."""
    try:
        data = request.get_json(silent=True) or {}
        checkpoint = GameWinModel.save_checkpoint(data)
        return jsonify({
            "success": True,
            "message": "Checkpoint saved in database successfully!",
            "checkpoint": checkpoint
        }), 200
    except Exception as e:
        print(f"[Save Checkpoint Error]: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@game_bp.route("/checkpoint", methods=["GET"])
def get_checkpoint():
    """Retrieve the latest saved checkpoint for the user and era."""
    try:
        user_id = request.args.get("user_id", "default_traveller")
        era = request.args.get("era", "mughal")
        checkpoint = GameWinModel.get_checkpoint(user_id, era)
        return jsonify({
            "success": True,
            "has_checkpoint": checkpoint is not None,
            "checkpoint": checkpoint
        }), 200
    except Exception as e:
        print(f"[Get Checkpoint Error]: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@game_bp.route("/checkpoint/reset", methods=["POST"])
def reset_checkpoint():
    """Reset player checkpoint back to start of era upon user request."""
    try:
        data = request.get_json(silent=True) or {}
        user_id = data.get("user_id", "default_traveller")
        era = data.get("era", "mughal")
        initial = GameWinModel.reset_checkpoint(user_id, era)
        return jsonify({
            "success": True,
            "message": "Checkpoint reset to start successfully!",
            "checkpoint": initial
        }), 200
    except Exception as e:
        print(f"[Reset Checkpoint Error]: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# Authoritative Clue Radar Specifications for Jolly Bhai Genie
CLUE_HOTSPOTS = {
    "chiefs_house": {
        "clue_id": "wedding_ornament",
        "name": "Bridal Wedding Ornament",
        "description": "Gold bridal ornament tucked inside the carved wall alcove.",
        "min_x": 54.0, "max_x": 100.0, "min_y": 0.0, "max_y": 78.0
    },
    "treasury": {
        "clue_id": "tax_ledger",
        "name": "Diwan Salim Singh's Torn Tax Ledger",
        "description": "Crushed parchment ledger on the merchant's calculation table with balance scale.",
        "min_x": 34.0, "max_x": 74.0, "min_y": 0.0, "max_y": 76.0
    },
    "well": {
        "clue_id": "water_pots",
        "name": "Intact Desert Water Pots",
        "description": "Clay water vessels and supply caches left intact on the stepwell platform.",
        "min_x": 0.0, "max_x": 55.0, "min_y": 65.0, "max_y": 84.0
    },
    "bhangarh_gate": {
        "clue_id": "kathputli_fragment",
        "name": "Kathputli Sandstone Fragment",
        "description": "Carved puppet theater fragment resting near the broken gate ramparts.",
        "min_x": 0.0, "max_x": 100.0, "min_y": 65.0, "max_y": 100.0
    },
    "gopinath_temple": {
        "clue_id": "paliwal_seal",
        "name": "Paliwal Ledger Seal",
        "description": "Bronze horse medallion seal near the baoli sanctuary steps.",
        "min_x": 0.0, "max_x": 100.0, "min_y": 0.0, "max_y": 80.0
    },
    "palace_ruins": {
        "clue_id": "wanderers_verse",
        "name": "Wanderer's Verse Antelope Medallion",
        "description": "Ancient inscribed verse inside the 7-tiered royal palace ruins.",
        "min_x": 0.0, "max_x": 100.0, "min_y": 0.0, "max_y": 80.0
    }
}


@game_bp.route("/genie/clue-radar", methods=["POST", "GET"])
def genie_clue_radar():
    """Authoritative backend clue radar specifying when Jolly Bhai Genie should shake.

    RULES:
    1. Proximity: Player must physically enter the clue's coordinate bounding box.
    2. Uncollected: Clue must not be collected yet.
    3. Non-Intrusive: Exits, doorways, and unrelated room areas keep Genie calm (normal float).
    """
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
    else:
        data = request.args.to_dict()

    scene = data.get("scene", "")
    player_x = float(data.get("player_x") or data.get("x") or 0.0)
    player_y = float(data.get("player_y") or data.get("y") or 0.0)
    collected = data.get("collected_clues", [])
    if isinstance(collected, str):
        collected = [c.strip() for c in collected.split(",") if c.strip()]

    hotspot = CLUE_HOTSPOTS.get(scene)
    if not hotspot:
        return jsonify({
            "status": "success",
            "should_shake": False,
            "mode": "normal",
            "reason": "No hidden clue in this location."
        }), 200

    clue_id = hotspot["clue_id"]
    if clue_id in collected:
        return jsonify({
            "status": "success",
            "should_shake": False,
            "mode": "normal",
            "reason": f"{hotspot['name']} already discovered by player."
        }), 200

    in_proximity = (
        hotspot["min_x"] <= player_x <= hotspot["max_x"] and
        hotspot["min_y"] <= player_y <= hotspot["max_y"]
    )

    if in_proximity:
        return jsonify({
            "status": "success",
            "should_shake": True,
            "mode": "shaking",
            "clue_id": clue_id,
            "clue_name": hotspot["name"],
            "hint": f"💥 Quick, mere aaka! {hotspot['description']}",
            "reason": f"Player is in close proximity to undiscovered {hotspot['name']}."
        }), 200
    else:
        return jsonify({
            "status": "success",
            "should_shake": False,
            "mode": "normal",
            "clue_id": clue_id,
            "clue_name": hotspot["name"],
            "reason": "Player is in the chamber but not near the clue hotspot. Genie remains calm."
        }), 200
