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
load_dotenv()


def create_app():
    """Create and configure the Flask application instance.

    Sets up CORS for frontend communication, configures the JWT secret key
    for authentication, and registers the main and TTS API blueprints.

    Returns:
        Flask: The fully configured Flask application instance.
    """
    app = Flask(__name__)
    
    # Configure CORS (allow requests from frontend)
    CORS(app)
    
    # Configure JWT for authentication
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
    jwt = JWTManager(app)
    
    # Register Blueprints from app.controllers
    from app.controllers.main_controller import main_bp
    from app.controllers.tts_controller import tts_bp

    app.register_blueprint(main_bp, url_prefix='/api')
    app.register_blueprint(tts_bp, url_prefix='/api/tts')
    
    return app
