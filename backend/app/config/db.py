"""Database configuration and MongoDB connection manager.

Provides helper functions to retrieve a MongoClient instance and access
the default application database for Bharat Gatha.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")


_client = None


def get_db_client():
    """Create and return a cached MongoDB client connected to the configured URI."""
    global _client
    if _client is None:
        if not MONGO_URI:
            raise ValueError("MONGO_URI is not set in the .env file.")
        try:
            import certifi
            ca_file = certifi.where()
            _client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=5000,
                tlsCAFile=ca_file,
                tlsAllowInvalidCertificates=True
            )
        except Exception:
            _client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=5000,
                tlsAllowInvalidCertificates=True
            )
    return _client


def get_db():
    """Retrieve the default MongoDB database instance for Bharat Gatha."""
    client = get_db_client()
    return client['bharat_gatha']
