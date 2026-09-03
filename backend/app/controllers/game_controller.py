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
            "is_sheesh_mirror_solved": "sheesh_mahal_reflection" in solved_list
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
