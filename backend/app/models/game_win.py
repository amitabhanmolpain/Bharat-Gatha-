"""Game Win and Progress Model for MongoDB.

Manages recording, querying, and updating user puzzle and scenario victories
across historical eras (Mughal Empire, Rajasthan, Vijayanagara).
Stores explicit 'solved: True' status, timestamps, and prize records in MongoDB.
"""

from datetime import datetime
import json
import os
from bson import ObjectId
from app.config.db import get_db

LOCAL_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LOCAL_DATA_FILE = os.path.join(LOCAL_DATA_DIR, "game_wins.json")
LOCAL_PROGRESS_FILE = os.path.join(LOCAL_DATA_DIR, "user_progress.json")


def _ensure_local_store():
    if not os.path.exists(LOCAL_DATA_DIR):
        os.makedirs(LOCAL_DATA_DIR, exist_ok=True)
    if not os.path.exists(LOCAL_DATA_FILE):
        with open(LOCAL_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
    if not os.path.exists(LOCAL_PROGRESS_FILE):
        with open(LOCAL_PROGRESS_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f)


def _save_local_win(record: dict):
    _ensure_local_store()
    try:
        with open(LOCAL_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = []

    serializable = dict(record)
    if "_id" in serializable:
        serializable["_id"] = str(serializable["_id"])
    if isinstance(serializable.get("created_at"), datetime):
        serializable["created_at"] = serializable["created_at"].isoformat()
    if isinstance(serializable.get("solved_at"), datetime):
        serializable["solved_at"] = serializable["solved_at"].isoformat()
    data.append(serializable)

    with open(LOCAL_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    # Update local progress file
    try:
        with open(LOCAL_PROGRESS_FILE, "r", encoding="utf-8") as f:
            progress = json.load(f)
    except Exception:
        progress = {}

    user_key = f"{record.get('user_id')}_{record.get('era')}"
    if user_key not in progress:
        progress[user_key] = {
            "user_id": record.get("user_id"),
            "era": record.get("era"),
            "solved_puzzles": [],
            "prizes_unlocked": [],
            "total_score": 0
        }

    game_type = record.get("game_type")
    prize = record.get("prize_unlocked")
    if game_type and game_type not in progress[user_key]["solved_puzzles"]:
        progress[user_key]["solved_puzzles"].append(game_type)
    if prize and prize not in progress[user_key]["prizes_unlocked"]:
        progress[user_key]["prizes_unlocked"].append(prize)
    progress[user_key]["total_score"] += record.get("score", 100)

    with open(LOCAL_PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)


def _get_local_wins(user_id: str, era: str = None):
    _ensure_local_store()
    try:
        with open(LOCAL_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return []

    results = []
    for item in data:
        if item.get("user_id") == user_id:
            if not era or item.get("era") == era:
                results.append(item)
    return results


def _get_local_solved_puzzles(user_id: str, era: str = None):
    _ensure_local_store()
    try:
        with open(LOCAL_PROGRESS_FILE, "r", encoding="utf-8") as f:
            progress = json.load(f)
        user_key = f"{user_id}_{era or 'mughal'}"
        if user_key in progress:
            return progress[user_key].get("solved_puzzles", [])
    except Exception:
        pass
    wins = _get_local_wins(user_id, era)
    return list(set(w.get("game_type") for w in wins if w.get("solved") or w.get("game_type")))


class GameWinModel:
    """MongoDB Data Access Model for Game Wins & Solved Progress."""

    @staticmethod
    def get_collection():
        """Retrieve the MongoDB 'game_wins' collection handle."""
        db = get_db()
        return db["game_wins"]

    @staticmethod
    def get_user_collection():
        """Retrieve the MongoDB 'user_progress' collection handle."""
        db = get_db()
        return db["user_progress"]

    @classmethod
    def record_win(cls, win_data: dict) -> dict:
        """Insert a solved game win record into MongoDB and update user progress.

        Args:
            win_data (dict): Dictionary containing user_id, era, game_type, prize_unlocked.
        """
        now = datetime.utcnow()
        user_id = str(win_data.get("user_id", "default_traveller"))
        era = str(win_data.get("era", "mughal"))
        game_type = str(win_data.get("game_type", "unknown_game"))
        prize_unlocked = str(win_data.get("prize_unlocked", "Imperial Clearance"))

        record = {
            "user_id": user_id,
            "era": era,
            "game_type": game_type,
            "solved": True,
            "is_solved": True,
            "status": "solved",
            "prize_unlocked": prize_unlocked,
            "clues_found": win_data.get("clues_found", []),
            "score": win_data.get("score", 100),
            "moves": win_data.get("moves", 0),
            "created_at": now,
            "solved_at": now,
            "metadata": win_data.get("metadata", {})
        }

        # Attempt primary MongoDB insertion
        saved_to_mongo = False
        try:
            collection = cls.get_collection()
            user_progress_col = cls.get_user_collection()

            result = collection.insert_one(record)
            record["_id"] = str(result.inserted_id)
            saved_to_mongo = True

            # Mark explicitly as solved in user progress collection
            user_progress_col.update_one(
                {"user_id": user_id, "era": era},
                {
                    "$inc": {"total_wins": 1, "total_xp": record["score"]},
                    "$set": {
                        "last_active": now,
                        f"puzzles.{game_type}.solved": True,
                        f"puzzles.{game_type}.status": "solved",
                        f"puzzles.{game_type}.solved_at": now
                    },
                    "$addToSet": {
                        "solved_puzzles": game_type,
                        "completed_games": game_type,
                        "prizes_unlocked": prize_unlocked
                    }
                },
                upsert=True
            )
        except Exception as mongo_err:
            print(f"[MongoDB Notice]: Recording solved status to persistent cache (cluster notice: {mongo_err})")
            if "_id" not in record:
                record["_id"] = f"win_{int(now.timestamp() * 1000)}"

        # Save copy to local persistent ledger
        _save_local_win(record)
        
        # Ensure all fields are JSON serializable for Flask response
        serializable_record = dict(record)
        serializable_record["_id"] = str(record.get("_id", ""))
        if isinstance(serializable_record.get("created_at"), datetime):
            serializable_record["created_at"] = serializable_record["created_at"].isoformat()
        if isinstance(serializable_record.get("solved_at"), datetime):
            serializable_record["solved_at"] = serializable_record["solved_at"].isoformat()
        serializable_record["storage"] = "mongodb" if saved_to_mongo else "persistent_cache"

        return serializable_record

    @classmethod
    def get_user_wins(cls, user_id: str, era: str = None) -> list:
        """Retrieve all recorded wins for a specific user."""
        try:
            collection = cls.get_collection()
            query = {"user_id": user_id}
            if era:
                query["era"] = era

            cursor = collection.find(query).sort("created_at", -1).limit(50)
            wins = []
            for doc in cursor:
                doc["_id"] = str(doc["_id"])
                if isinstance(doc.get("created_at"), datetime):
                    doc["created_at"] = doc["created_at"].isoformat()
                if isinstance(doc.get("solved_at"), datetime):
                    doc["solved_at"] = doc["solved_at"].isoformat()
                wins.append(doc)
            if wins:
                return wins
        except Exception:
            pass

        return _get_local_wins(user_id, era)

    @classmethod
    def get_solved_puzzles(cls, user_id: str, era: str = None) -> list:
        """Retrieve unique list of solved puzzle identifiers for a user."""
        try:
            user_progress_col = cls.get_user_collection()
            query = {"user_id": user_id}
            if era:
                query["era"] = era

            progress_doc = user_progress_col.find_one(query)
            if progress_doc and "solved_puzzles" in progress_doc:
                return list(set(progress_doc["solved_puzzles"]))
        except Exception:
            pass

        return _get_local_solved_puzzles(user_id, era)

    @classmethod
    def save_checkpoint(cls, data: dict) -> dict:
        """Save full game checkpoint to MongoDB and persistent disk cache."""
        user_id = str(data.get("user_id", "default_traveller"))
        era = str(data.get("era", "mughal"))
        now = datetime.utcnow()
        
        checkpoint = {
            "user_id": user_id,
            "era": era,
            "scene": data.get("scene", "gate"),
            "playerPos": data.get("playerPos", {"x": 50.0, "y": 86.0}),
            "hasGuardPermission": bool(data.get("hasGuardPermission", False)),
            "hasKhasPermission": bool(data.get("hasKhasPermission", False)),
            "isPietraDuraSolved": bool(data.get("isPietraDuraSolved", False)),
            "isSheeshMirrorSolved": bool(data.get("isSheeshMirrorSolved", False)),
            "isArchaeologistTalked": bool(data.get("isArchaeologistTalked", False)),
            "isCarriageUnlocked": bool(data.get("isCarriageUnlocked", False)),
            "cluesFound": data.get("cluesFound", []),
            "last_saved_at": now.isoformat()
        }
        
        try:
            col = get_db()["user_checkpoints"]
            col.update_one(
                {"user_id": user_id, "era": era},
                {"$set": checkpoint},
                upsert=True
            )
        except Exception as e:
            print(f"Mongo checkpoint save error: {e}")
            
        # Local JSON fallback
        _ensure_local_store()
        try:
            chk_file = os.path.join(LOCAL_DATA_DIR, "user_checkpoints.json")
            all_chk = {}
            if os.path.exists(chk_file):
                with open(chk_file, "r", encoding="utf-8") as f:
                    all_chk = json.load(f)
            all_chk[f"{user_id}_{era}"] = checkpoint
            with open(chk_file, "w", encoding="utf-8") as f:
                json.dump(all_chk, f, indent=2)
        except Exception as e:
            print(f"Local checkpoint save error: {e}")
            
        return checkpoint

    @classmethod
    def get_checkpoint(cls, user_id: str, era: str) -> dict:
        """Retrieve the latest saved checkpoint from MongoDB or disk cache."""
        try:
            col = get_db()["user_checkpoints"]
            doc = col.find_one({"user_id": user_id, "era": era})
            if doc:
                doc.pop("_id", None)
                return doc
        except Exception as e:
            print(f"Mongo checkpoint get error: {e}")
            
        # Local JSON fallback
        try:
            chk_file = os.path.join(LOCAL_DATA_DIR, "user_checkpoints.json")
            if os.path.exists(chk_file):
                with open(chk_file, "r", encoding="utf-8") as f:
                    all_chk = json.load(f)
                    return all_chk.get(f"{user_id}_{era}")
        except Exception:
            pass
        return None

    @classmethod
    def reset_checkpoint(cls, user_id: str, era: str) -> dict:
        """Reset checkpoint to start of game."""
        initial = {
            "user_id": user_id,
            "era": era,
            "scene": "gate",
            "playerPos": {"x": 50.0, "y": 86.0},
            "hasGuardPermission": False,
            "hasKhasPermission": False,
            "isPietraDuraSolved": False,
            "isSheeshMirrorSolved": False,
            "isArchaeologistTalked": False,
            "isCarriageUnlocked": False,
            "cluesFound": [],
            "last_saved_at": datetime.utcnow().isoformat()
        }
        try:
            col = get_db()["user_checkpoints"]
            col.delete_one({"user_id": user_id, "era": era})
        except Exception:
            pass
        try:
            chk_file = os.path.join(LOCAL_DATA_DIR, "user_checkpoints.json")
            if os.path.exists(chk_file):
                with open(chk_file, "r", encoding="utf-8") as f:
                    all_chk = json.load(f)
                all_chk.pop(f"{user_id}_{era}", None)
                with open(chk_file, "w", encoding="utf-8") as f:
                    json.dump(all_chk, f, indent=2)
        except Exception:
            pass
        return initial
