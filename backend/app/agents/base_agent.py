"""Base AI Agent infrastructure and shared utilities for Bharat Gatha.

Provides common configuration, prompt utilities, and base interface definitions
for all historical and companion LangChain agents.
"""

from typing import Dict, Any, Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def get_default_llm_model() -> str:
    """Return the default Groq LLM model identifier."""
    return os.getenv("DEFAULT_AGENT_MODEL", "openai/gpt-oss-120b")


def sanitize_input_text(text: Optional[str]) -> str:
    """Trim and sanitize user input text for agent prompt pipelines."""
    if not text:
        return ""
    return str(text).strip()
