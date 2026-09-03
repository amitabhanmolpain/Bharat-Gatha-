"""Application factory module for the Bharat Gatha Flask backend.

Initializes the Flask application, configures middleware such as CORS
and JWT authentication, and registers routing blueprints.
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

from controllers.main_controller import main_bp

# Load environment variables
load_dotenv()


def create_app():
    """Create and configure the Flask application instance.

    Sets up CORS for frontend communication, configures the JWT secret key
    for authentication, and registers the main API blueprint.

    Returns:
        Flask: The fully configured Flask application instance.
    """
    app = Flask(__name__)
    
    # Configure CORS (allow requests from frontend)
    CORS(app)
    
    # Configure JWT for authentication
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
    jwt = JWTManager(app)
    
    # Register Blueprints (Routes)
    app.register_blueprint(main_bp, url_prefix='/api')
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
