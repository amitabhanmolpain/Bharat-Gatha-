import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

def get_db_client():
    if not MONGO_URI:
        raise ValueError("MONGO_URI is not set in the .env file.")
    
    client = MongoClient(MONGO_URI)
    return client

def get_db():
    client = get_db_client()
    # The database name defaults to 'bharat_gatha'. 
    # MongoDB will create it automatically when you insert the first document.
    return client['bharat_gatha']
