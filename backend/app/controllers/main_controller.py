"""Main API controller and health check endpoints.

Defines blueprint routes for system status verification and general service health.
"""

from flask import Blueprint, jsonify
from app.config.db import get_db_client

main_bp = Blueprint('main', __name__)

@main_bp.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "success", 
        "message": "Bharat Gatha Backend is running successfully!"
    }), 200

@main_bp.route('/health', methods=['GET'])
def health_check():
    """Perform a service health check for the Bharat Gatha backend."""
    status = "ok"
    database = "connected"
    try:
        client = get_db_client()
        client.admin.command('ping')
    except Exception as e:
        database = "disconnected"

    return jsonify({
        "status": status,
        "service": "bharat-gatha-api",
        "database": database
    }), 200
