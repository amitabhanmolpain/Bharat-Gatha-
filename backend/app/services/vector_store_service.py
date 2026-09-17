"""Vector Store Service for Bharat Gatha RAG Pipeline.

Manages local persistent ChromaDB storage with separate collections per historical region:
- "mughal_kb"
- "rajputana_kb"
- "vijayanagara_kb"

Supports SHA256 checksum-based automatic rebuild on startup.
"""

import os
import json
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb

from app.config.rag_config import (
    VECTOR_DB_DIR,
    KB_FILES,
    REGION_COLLECTIONS,
    DEFAULT_TOP_K,
)
from app.services.chunking_service import chunk_markdown_by_headers
from app.services.embedding_service import embed_texts, embed_text

_client_instance = None


def get_chroma_client():
    """Singleton getter for ChromaDB PersistentClient."""
    global _client_instance
    if _client_instance is None:
        VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)
        _client_instance = chromadb.PersistentClient(path=str(VECTOR_DB_DIR))
    return _client_instance


def calculate_file_hash(filepath: Path) -> str:
    """Compute SHA256 hash of a file."""
    if not filepath.exists():
        return ""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def get_stored_checksums() -> Dict[str, str]:
    """Load cached checksums from vector db directory."""
    checksum_file = VECTOR_DB_DIR / "checksums.json"
    if checksum_file.exists():
        try:
            with open(checksum_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_checksums(checksums: Dict[str, str]):
    """Save updated checksums to vector db directory."""
    checksum_file = VECTOR_DB_DIR / "checksums.json"
    with open(checksum_file, "w", encoding="utf-8") as f:
        json.dump(checksums, f, indent=2)


def build_index(force_rebuild: bool = False) -> Dict[str, Any]:
    """Index all source knowledge base files into region-scoped ChromaDB collections.

    Checks hashes to avoid rebuilding on every server restart unless files change.
    """
    client = get_chroma_client()
    stored_checksums = get_stored_checksums()
    new_checksums = {}
    changes_detected = force_rebuild
    stats = {}

    for region, kb_path in KB_FILES.items():
        curr_hash = calculate_file_hash(kb_path)
        new_checksums[region] = curr_hash
        if curr_hash != stored_checksums.get(region):
            changes_detected = True

    if not changes_detected:
        # Check if collections actually have documents
        all_collections_ready = True
        for region, collection_name in REGION_COLLECTIONS.items():
            if region in ("rajasthan", "hampi"):
                continue
            try:
                col = client.get_collection(collection_name)
                if col.count() == 0:
                    all_collections_ready = False
            except Exception:
                all_collections_ready = False

        if all_collections_ready:
            return {"status": "skipped", "message": "Index up-to-date, hashes match."}

    # Populate collections
    for region, kb_path in KB_FILES.items():
        collection_name = REGION_COLLECTIONS[region]
        if not kb_path.exists():
            continue

        try:
            client.delete_collection(collection_name)
        except Exception:
            pass

        collection = client.create_collection(name=collection_name, metadata={"hnsw:space": "cosine"})
        chunks = chunk_markdown_by_headers(str(kb_path))
        if not chunks:
            continue

        texts = [c["text"] for c in chunks]
        ids = [c["id"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]
        embeddings = embed_texts(texts)

        collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )
        stats[collection_name] = len(chunks)

    save_checksums(new_checksums)
    return {"status": "success", "stats": stats}


def query_index(region: str, query_text: str, top_k: int = DEFAULT_TOP_K) -> List[Dict[str, Any]]:
    """Query the region-specific collection for relevant chunks.

    Args:
        region (str): "mughal", "rajputana", "vijayanagara".
        query_text (str): Player's historical question.
        top_k (int): Number of top matches to return.

    Returns:
        List[Dict[str, Any]]: Matching chunks with text, metadata, similarity score.
    """
    clean_region = region.lower().strip()
    collection_name = REGION_COLLECTIONS.get(clean_region, "mughal_kb")

    client = get_chroma_client()
    try:
        collection = client.get_collection(collection_name)
    except Exception:
        build_index(force_rebuild=True)
        collection = client.get_collection(collection_name)

    query_vector = embed_text(query_text)
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    matching_chunks = []
    if results and "documents" in results and results["documents"]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
        distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
        ids = results["ids"][0] if "ids" in results else [f"chunk_{i}" for i in range(len(docs))]

        for doc_id, doc, meta, dist in zip(ids, docs, metas, distances):
            similarity = round(max(0.0, 1.0 - float(dist)), 4)
            matching_chunks.append({
                "id": doc_id,
                "text": doc,
                "metadata": meta,
                "distance": dist,
                "similarity_score": similarity
            })

    return matching_chunks
