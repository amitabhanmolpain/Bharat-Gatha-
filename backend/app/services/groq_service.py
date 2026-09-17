"""Groq AI Ask Question service for Bharat Gatha.

Connects to the Groq API using the 'openai/gpt-oss-120b' model to answer
in-game historical questions with rich, immersive era-specific context.
"""

import os
import requests

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"


def ask_historical_question(
    question: str,
    context: dict = None,
    model: str = "openai/gpt-oss-120b"
) -> dict:
    """Answer a player's historical question in the context of their current game state.

    Args:
        question (str): The player's question.
        context (dict, optional): Current game context (year, era, location, ruler, etc.).
        model (str, optional): Groq model identifier (default: 'openai/gpt-oss-120b').

    Returns:
        dict: Result with 'status', 'answer', and 'model' or error details.
    """
    groq_api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ")
    if not groq_api_key:
        return {
            "status": "error",
            "message": "GROQ_API_KEY is not configured in backend environment.",
            "status_code": 500
        }

    clean_question = question.strip() if question else ""
    if not clean_question:
        return {
            "status": "error",
            "message": "Missing 'question' parameter.",
            "status_code": 400
        }

    ctx = context or {}
    year = ctx.get("current_year", 1653)
    era = ctx.get("era", "Mughal Empire")
    location = ctx.get("location", "Taj Mahal")
    ruler = ctx.get("ruler", "Emperor Shah Jahan")
    monuments = ctx.get("nearby_monuments", "Agra Fort, Mehtab Bagh, Yamuna River")
    events = ctx.get("historical_events", "Reign of Shah Jahan, construction of Taj Mahal")

    system_prompt = (
        f"You are speaking to a student playing the educational historical RPG game 'Bharat Gatha'.\n"
        f"The player is exploring Indian history in this context:\n"
        f"- Year: {year}, Era: {era}, Location: {location}, Ruler: {ruler}\n"
        f"- Landmarks: {monuments}\n"
        f"- Historical Setting: {events}\n\n"
        f"Guidelines for your response:\n"
        f"1. Use simple, clear English with common everyday words.\n"
        f"2. Keep responses short: 1 to 2 short sentences (15 to 25 words total).\n"
        f"3. Explain one main idea at a time so the student is never overwhelmed.\n"
        f"4. Avoid academic, textbook, or overly poetic language.\n"
        f"5. Preserve 100% accurate historical facts, names, dates, and locations."
    )

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": clean_question}
        ],
        "temperature": 0.7,
        "max_tokens": 250
    }

    try:
        response = requests.post(GROQ_CHAT_URL, headers=headers, json=payload, timeout=20)
        
        # Fallback to llama-3.3-70b-versatile if the specific model has temporary issues
        if response.status_code != 200:
            payload["model"] = "llama-3.3-70b-versatile"
            response = requests.post(GROQ_CHAT_URL, headers=headers, json=payload, timeout=20)

        if response.status_code != 200:
            return {
                "status": "error",
                "message": f"Groq API Error ({response.status_code}): {response.text}",
                "status_code": response.status_code
            }

        res_json = response.json()
        answer = res_json["choices"][0]["message"]["content"].strip()
        used_model = res_json.get("model", model)

        return {
            "status": "success",
            "answer": answer,
            "model": used_model,
            "context": ctx,
            "status_code": 200
        }

    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "message": "Groq API request timed out.",
            "status_code": 504
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to generate answer from Groq: {str(e)}",
            "status_code": 500
        }
