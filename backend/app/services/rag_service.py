"""RAG Service for Bharat Gatha.

Orchestrates:
1. Retrieval of region-scoped chunks from ChromaDB
2. Construction of grounded prompts
3. Generation of era-faithful historical answers via Groq LLM in character as 'Jolly Bhai'
"""

import os
from typing import Dict, Any, List
from app.services.vector_store_service import query_index
from app.services.groq_service import ask_historical_question
from app.config.rag_config import DEFAULT_TOP_K


def get_grounded_answer(
    region: str,
    scene: str,
    player_question: str,
    top_k: int = DEFAULT_TOP_K
) -> Dict[str, Any]:
    """Retrieve grounded historical context and generate in-character Jolly Bhai answer.

    Args:
        region (str): Player's historical era/region ('mughal', 'rajputana', 'vijayanagara').
        scene (str): Current scene or monument.
        player_question (str): The player's question.
        top_k (int): Number of source knowledge chunks to retrieve.

    Returns:
        Dict[str, Any]:
            - answer: The generated grounded answer string
            - retrieved_chunks: Raw list of retrieved chunks with metadata
            - region: Region used
            - scene: Scene used
            - status: 'success' or 'error'
    """
    clean_q = player_question.strip() if player_question else ""
    if not clean_q:
        return {
            "status": "error",
            "message": "Player question cannot be empty.",
            "answer": "Pardon me, traveler, but what is it you wish to ask of our past?",
            "retrieved_chunks": []
        }

    # 1. Query Vector Store for relevant chunks
    chunks = query_index(region=region, query_text=clean_q, top_k=top_k)

    # 2. Build context string from retrieved chunks
    context_blocks = []
    for idx, c in enumerate(chunks, start=1):
        loc = c.get("metadata", {}).get("location", "Historical Chronicle")
        context_blocks.append(f"--- Document Section {idx} [{loc}] ---\n{c['text']}")

    joined_context = "\n\n".join(context_blocks) if context_blocks else "No specific chronicle found."

    # 3. Formulate Groq prompt conditioning on retrieved context
    grounded_context_dict = {
        "era": f"{region.capitalize()} Period",
        "location": scene,
        "historical_events": f"Retrieved Knowledge Base Excerpts:\n{joined_context}",
        "nearby_monuments": ", ".join([c.get("metadata", {}).get("location", "") for c in chunks if c.get("metadata")]),
        "ruler": "Historical Ruler of the Era",
        "current_year": "Historical Era"
    }

    groq_result = ask_historical_question(
        question=(
            f"You are Jolly Bhai, the beloved, warm, and wise historical genie guide in Bharat Gatha.\n"
            f"Use the verified chronicles below to enrich your response with authentic historical facts, dates, and names.\n"
            f"Draw upon your deep, accurate knowledge of Indian history and folklore to answer the player's question warmly and engagingly.\n"
            f"Keep your response concise (exactly 2 clear sentences, ~20-30 words) so it fits comfortably in the retro dialogue box.\n\n"
            f"Verified Reference Chronicles:\n{joined_context}\n\n"
            f"Player Question: {clean_q}"
        ),
        context=grounded_context_dict,
        model="openai/gpt-oss-120b"
    )

    generated_answer = groq_result.get("answer", "")

    return {
        "status": "success",
        "answer": generated_answer,
        "retrieved_chunks": chunks,
        "region": region,
        "scene": scene,
        "model": groq_result.get("model", "openai/gpt-oss-120b")
    }
