import datetime
import re
from typing import Optional, Dict, Any
from bson import ObjectId
import bcrypt
from app.config.db import get_db, get_sqlite_conn
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging
import json
import os

logger = logging.getLogger(__name__)

class UserModel:
    collection_name = 'users'

    @classmethod
    def get_collection(cls):
        return get_db()[cls.collection_name]

    @classmethod
    def _sqlite_row_to_dict(cls, row) -> Dict[str, Any]:
        d = dict(row)
        d["_id"] = str(d["id"])
        # Parse lists if stored as string
        if d.get("authProviders"):
            try:
                d["authProviders"] = json.loads(d["authProviders"])
            except:
                d["authProviders"] = [d["authProviders"]]
        # Format datetimes
        for field in ["createdAt", "updatedAt", "lastLoginAt"]:
            if d.get(field):
                try:
                    d[field] = datetime.datetime.fromisoformat(d[field])
                except:
                    pass
        return d

    @classmethod
    def create_user(cls, name: str, email: str, password: Optional[str] = None, google_id: Optional[str] = None, avatar: Optional[str] = None) -> Dict[str, Any]:
        normalized_email = email.strip().lower()
        
        password_hash = None
        if password:
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

        auth_providers = ["google"] if google_id else ["email"]

        if os.getenv("DATABASE_MODE", "mongodb") == "sqlite":
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT * FROM users WHERE normalizedEmail = ? OR (googleId IS NOT NULL AND googleId = ?)", (normalized_email, google_id))
            existing = cursor.fetchone()
            if existing:
                return cls._sqlite_row_to_dict(existing)
            
            now = datetime.datetime.utcnow().isoformat()
            cursor.execute('''
                INSERT INTO users (name, email, normalizedEmail, passwordHash, googleId, authProviders, avatar, role, createdAt, updatedAt, lastLoginAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                name.strip(), email.strip(), normalized_email, password_hash, google_id, json.dumps(auth_providers),
                avatar or "/player.png", "Royal Historian", now, now, now
            ))
            conn.commit()
            
            user_id = cursor.lastrowid
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            return cls._sqlite_row_to_dict(cursor.fetchone())
        else:
            try:
                # Check if user exists
                existing = cls.get_collection().find_one({
                    "$or": [
                        {"normalizedEmail": normalized_email},
                        {"googleId": google_id} if google_id else {"_id": None}
                    ]
                })
                if existing:
                    return existing
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                logger.error(f"Database connection error: {e}")
                raise Exception("Database unavailable")

            new_user = {
                "name": name.strip(),
                "email": email.strip(),
                "normalizedEmail": normalized_email,
                "passwordHash": password_hash,
                "googleId": google_id,
                "authProviders": auth_providers,
                "avatar": avatar or "/player.png",
                "role": "Royal Historian",
                "level": 1,
                "xp": 0,
                "gamesPlayed": 0,
                "gamesWon": 0,
                "highestScore": 0,
                "createdAt": datetime.datetime.utcnow(),
                "updatedAt": datetime.datetime.utcnow(),
                "lastLoginAt": datetime.datetime.utcnow()
            }
            
            try:
                result = cls.get_collection().insert_one(new_user)
                new_user["_id"] = result.inserted_id
                return new_user
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                logger.error(f"Database connection error: {e}")
                raise Exception("Database unavailable")

    @classmethod
    def find_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        normalized = email.strip().lower()
        if os.getenv("DATABASE_MODE", "mongodb") == "sqlite":
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE normalizedEmail = ?", (normalized,))
            row = cursor.fetchone()
            return cls._sqlite_row_to_dict(row) if row else None
        else:
            try:
                return cls.get_collection().find_one({"normalizedEmail": normalized})
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                logger.error(f"Database connection error: {e}")
                raise Exception("Database unavailable")
    
    @classmethod
    def find_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        if os.getenv("DATABASE_MODE", "mongodb") == "sqlite":
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            return cls._sqlite_row_to_dict(row) if row else None
        else:
            try:
                return cls.get_collection().find_one({"_id": ObjectId(user_id)})
            except Exception:
                return None

    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        if not hashed_password:
            return False
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
