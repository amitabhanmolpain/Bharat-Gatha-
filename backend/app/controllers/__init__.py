"""Controllers package for backend route handling and endpoints."""

from app.controllers.main_controller import main_bp
from app.controllers.tts_controller import tts_bp

__all__ = ["main_bp", "tts_bp"]
