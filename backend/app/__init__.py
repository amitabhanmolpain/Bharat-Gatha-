"""Application factory module for the Bharat Gatha Flask backend.

Initializes the Flask application, configures CORS middleware,
JWT authentication, and registers routing blueprints.
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
import werkzeug
from dotenv import load_dotenv

# Compatibility patch for Werkzeug 3.x+
if not hasattr(werkzeug, '__version__'):
    try:
        import importlib.metadata
        werkzeug.__version__ = importlib.metadata.version('werkzeug')
    except Exception:
        werkzeug.__version__ = '3.0.0'

# Load environment variables
load_dotenv(override=True)


def create_app():
    """Create and configure the Flask application instance.

    Sets up CORS for frontend communication, configures the JWT secret key
    for authentication, and registers the main and TTS API blueprints.

    Returns:
        Flask: The fully configured Flask application instance.
    """
    app = Flask(__name__)
    
    # Configure CORS (allow requests from frontend)
    CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
    
    # Configure JWT for authentication
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
    app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
    app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token"
    app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token"
    app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production (requires HTTPS)
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Disable CSRF for this prototype setup
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900  # 15 minutes
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400 * 7  # 7 days
    jwt = JWTManager(app)
    
    # Register Blueprints from app.controllers
    from app.controllers.main_controller import main_bp
    from app.controllers.tts_controller import tts_bp
    from app.controllers.ai_controller import ai_bp
    from app.controllers.game_controller import game_bp
    from app.controllers.auth_controller import auth_bp
    from app.controllers.user_controller import user_bp

    app.register_blueprint(main_bp, url_prefix='/api')
    app.register_blueprint(tts_bp, url_prefix='/api/tts')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(game_bp, url_prefix='/api/game')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        return {"error": "Internal Server Error", "message": str(e)}, 500

    return app
