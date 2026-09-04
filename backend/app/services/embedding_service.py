"""Embedding Service for Bharat Gatha RAG Pipeline.

Uses local sentence-transformers ('all-MiniLM-L6-v2') without paid external APIs.
"""

from typing import List
from app.config.rag_config import EMBEDDING_MODEL_NAME

_model_instance = None


def get_embedding_model():
    """Singleton getter for the sentence-transformers model."""
    global _model_instance
    if _model_instance is None:
        from sentence_transformers import SentenceTransformer
        _model_instance = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model_instance


def embed_text(text: str) -> List[float]:
    """Generate a vector embedding for a single text string.

    Args:
        text (str): Input text to embed.

    Returns:
        List[float]: 384-dimensional dense vector representation.
    """
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def embed_texts(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    """Batch-embed a list of text strings efficiently.

    Args:
        texts (List[str]): List of texts to embed.
        batch_size (int): Batch size for inference.

    Returns:
        List[List[float]]: List of vector embeddings.
    """
    if not texts:
        return []
    model = get_embedding_model()
    embeddings = model.encode(texts, batch_size=batch_size, convert_to_numpy=True, show_progress_bar=False)
    return embeddings.tolist()
