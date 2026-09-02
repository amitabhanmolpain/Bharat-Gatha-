from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "success", 
        "message": "Bharat Gatha Backend is running successfully!"
    }), 200
