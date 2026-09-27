from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import UserModel
import datetime
from app.config.db import get_db

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = UserModel.find_by_id(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Calculate rank
    rank = UserModel.get_collection().count_documents({"xp": {"$gt": user.get("xp", 0)}}) + 1
    if user.get("xp", 0) == 0 and user.get("gamesPlayed", 0) == 0:
        rank = None
    
    recent_adventures = list(get_db()['game_results'].find({"userId": current_user_id}).sort("createdAt", -1).limit(5))
    for adv in recent_adventures:
        adv["_id"] = str(adv["_id"])
        if "createdAt" in adv:
            adv["createdAt"] = adv["createdAt"].isoformat()

    return jsonify({
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "avatar": user.get("avatar"),
            "role": user.get("role")
        },
        "stats": {
            "gamesPlayed": user.get("gamesPlayed", 0),
            "gamesWon": user.get("gamesWon", 0),
            "winRate": int((user.get("gamesWon", 0) / user.get("gamesPlayed", 1)) * 100) if user.get("gamesPlayed", 0) > 0 else 0,
            "highestScore": user.get("highestScore", 0),
            "xp": user.get("xp", 0),
            "level": user.get("level", 1),
            "rank": rank
        },
        "recentAdventures": recent_adventures
    }), 200

@user_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    limit = int(request.args.get("limit", 100))
    # Fetch players, sort by xp descending, then highestScore descending
    players = list(UserModel.get_collection().find(
        {"xp": {"$gt": 0}}
    ).sort([("xp", -1), ("highestScore", -1)]).limit(limit))
    
    entries = []
    for idx, p in enumerate(players):
        entries.append({
            "rank": idx + 1,
            "userId": str(p["_id"]),
            "name": p.get("name"),
            "title": p.get("role", "Traveler"),
            "xp": p.get("xp", 0),
            "avatar": p.get("avatar")
        })
    
    return jsonify({
        "entries": entries,
        "pagination": {
            "page": 1,
            "limit": limit,
            "total": len(entries)
        }
    }), 200

@user_bp.route('/games/results', methods=['POST'])
@jwt_required()
def submit_game_result():
    current_user_id = get_jwt_identity()
    user = UserModel.find_by_id(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
        
    score = data.get("score", 0)
    won = data.get("won", False)
    xp_earned = data.get("xpEarned", 0)
    
    # Save game result
    game_result = {
        "userId": current_user_id,
        "gameId": data.get("gameId"),
        "adventureName": data.get("adventureName", "Unknown Adventure"),
        "score": score,
        "won": won,
        "xpEarned": xp_earned,
        "duration": data.get("duration", 0),
        "metadata": data.get("metadata", {}),
        "createdAt": datetime.datetime.utcnow()
    }
    
    get_db()['game_results'].insert_one(game_result)
    
    # Update user stats
    new_games_played = user.get("gamesPlayed", 0) + 1
    new_games_won = user.get("gamesWon", 0) + (1 if won else 0)
    new_highest_score = max(user.get("highestScore", 0), score)
    new_xp = user.get("xp", 0) + xp_earned
    new_level = max(1, (new_xp // 1000) + 1)
    
    UserModel.get_collection().update_one(
        {"_id": user["_id"]},
        {"$set": {
            "gamesPlayed": new_games_played,
            "gamesWon": new_games_won,
            "highestScore": new_highest_score,
            "xp": new_xp,
            "level": new_level
        }}
    )
    
    return jsonify({"message": "Game result recorded successfully"}), 201
