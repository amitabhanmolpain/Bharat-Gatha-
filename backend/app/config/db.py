"""Database configuration and MongoDB connection manager.

Provides helper functions to retrieve a MongoClient instance and access
the default application database for Bharat Gatha.
"""

import os
import sqlite3
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(override=True)

DATABASE_MODE = os.getenv("DATABASE_MODE", "mongodb")
MONGO_URI = os.getenv("MONGO_URI")

_mongo_client = None
_sqlite_conn = None


def get_db_client():
    """Create and return a cached MongoDB client connected to the configured URI."""
    global _mongo_client
    if _mongo_client is None:
        if not MONGO_URI:
            raise ValueError("MONGO_URI is not set in the .env file.")
        try:
            import certifi
            ca_file = certifi.where()
            _mongo_client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=5000,
                tlsCAFile=ca_file,
                tlsAllowInvalidCertificates=True
            )
        except Exception:
            _mongo_client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=5000,
                tlsAllowInvalidCertificates=True
            )
    return _mongo_client

def get_db():
    """Retrieve the default MongoDB database instance for Bharat Gatha."""
    client = get_db_client()
    return client['bharat_gatha']

def get_sqlite_conn():
    """Create and return a cached SQLite connection for local development."""
    global _sqlite_conn
    if _sqlite_conn is None:
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dev.db")
        _sqlite_conn = sqlite3.connect(db_path, check_same_thread=False)
        _sqlite_conn.row_factory = sqlite3.Row
        
        # Initialize schema if it doesn't exist
        _sqlite_conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                normalizedEmail TEXT NOT NULL UNIQUE,
                passwordHash TEXT,
                googleId TEXT UNIQUE,
                authProviders TEXT,
                avatar TEXT,
                role TEXT,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                gamesPlayed INTEGER DEFAULT 0,
                gamesWon INTEGER DEFAULT 0,
                highestScore INTEGER DEFAULT 0,
                createdAt DATETIME,
                updatedAt DATETIME,
                lastLoginAt DATETIME
            )
        ''')
        _sqlite_conn.commit()
    return _sqlite_conn
