"""Main API controller and health check endpoints.

Defines blueprint routes for system status verification and general service health.
"""

from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)


@main_bp.route('/', methods=['GET'])
def health_check():
    """Perform a service health check for the Bharat Gatha backend.

    Returns:
        tuple: A tuple containing a JSON response with status details
            and an HTTP status code (200).
    """
    return jsonify({
        "status": "success", 
        "message": "Bharat Gatha Backend is running successfully!"
    }), 200
