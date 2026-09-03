"""Database configuration and MongoDB connection manager.

Provides helper functions to retrieve a MongoClient instance and access
the default application database for Bharat Gatha.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")


def get_db_client():
    """Create and return a MongoDB client connected to the configured URI.

    Reads the MONGO_URI environment variable and establishes a connection
    using PyMongo.

    Returns:
        MongoClient: An active MongoDB client instance.

    Raises:
        ValueError: If the MONGO_URI environment variable is not defined.
    """
    if not MONGO_URI:
        raise ValueError("MONGO_URI is not set in the .env file.")
    
    client = MongoClient(MONGO_URI)
    return client


def get_db():
    """Retrieve the default MongoDB database instance for Bharat Gatha.

    Initializes the database client and returns a handle to the 'bharat_gatha'
    database collection namespace.

    Returns:
        Database: The PyMongo Database object for 'bharat_gatha'.
    """
    client = get_db_client()
    # The database name defaults to 'bharat_gatha'. 
    # MongoDB will create it automatically when you insert the first document.
    return client['bharat_gatha']
