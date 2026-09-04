"""Configuration settings for Bharat Gatha RAG (Retrieval-Augmented Generation) Pipeline."""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
KNOWLEDGE_BASE_DIR = DATA_DIR / "knowledge_base"
VECTOR_DB_DIR = DATA_DIR / "vector_db"

# Knowledge Base Files mapping to regions
KB_FILES = {
    "mughal": KNOWLEDGE_BASE_DIR / "mughal-empire-knowledge-base.md",
    "rajputana": KNOWLEDGE_BASE_DIR / "rajputana-knowledge-base.md",
    "vijayanagara": KNOWLEDGE_BASE_DIR / "vijayanagara-knowledge-base.md"
}

# ChromaDB Collection Names per region
REGION_COLLECTIONS = {
    "mughal": "mughal_kb",
    "rajputana": "rajputana_kb",
    "rajasthan": "rajputana_kb",
    "vijayanagara": "vijayanagara_kb",
    "hampi": "vijayanagara_kb"
}

# Embedding Model Configuration
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

# Retrieval & Guardrail Hyperparameters
DEFAULT_TOP_K = 3
FACT_GROUNDING_CONFIDENCE_THRESHOLD = 0.70

# Safe Fallback Dialogue for Ungrounded Claims
SAFE_FALLBACK_ANSWER = (
    "Beta, ancient records hold many mysteries, but according to our verified chronicles, "
    "that detail cannot be confirmed. Let me share what is truly inscribed in our history."
)
