"""LangChain-based Genie (Jolly Bhai) AI Agent for Bharat Gatha.

Builds an intelligent, era-aware LangChain conversational agent for Jolly Bhai,
the ancient time-traveling genie companion.

Guardrails:
- Strictly answers questions relating to Indian history, monuments, rulers,
  architectural marvels, historical lore, and the game Bharat Gatha.
- Politely refuses off-topic modern queries in-character.
- Uses simple, clear, balanced responses (exactly 2 concise sentences, ~20-30 words).
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Robust .env loader
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def get_genie_agent(model_name: str = "openai/gpt-oss-120b"):
    """Instantiate and configure the LangChain Genie Agent pipeline."""
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in backend environment.")

    try:
        llm = ChatGroq(
            model=model_name,
            api_key=api_key,
            temperature=0.5,
            max_tokens=800
        )
    except Exception:
        llm = ChatGroq(
            model="openai/gpt-oss-120b",
            api_key=api_key,
            temperature=0.5,
            max_tokens=800
        )

    system_template = (
        "You are Jolly Bhai, the ancient, magical, calm, and wise time-traveling Genie companion in the RPG game 'Bharat Gatha'.\n"
        "You speak in clear, warm Indian English with a gentle, friendly storytelling tone.\n\n"
        "STRICT LENGTH & STYLE RULES:\n"
        "1. LENGTH: Respond in exactly 2 concise, clear sentences (around 20 to 30 words). Not too long, not too short.\n"
        "2. LANGUAGE: Use simple, easy-to-understand words.\n"
        "3. DOMAIN: You ONLY answer questions about Indian history, monuments, rulers, battles, and the game 'Bharat Gatha'.\n"
        "4. OFF-TOPIC REFUSAL: If the player asks anything unrelated to history, refuse simply in 2 short sentences:\n"
        "   'My magical scrolls only hold the glorious history of Bharat Gatha! Ask me of ancient kings, grand forts, or lost treasures instead.'\n\n"
        "CURRENT ERA & GAME CONTEXT:\n"
        "- Current Year: {year}\n"
        "- Historical Era: {era}\n"
        "- Location: {location}\n"
        "- Ruler: {ruler}\n"
        "- Monuments: {monuments}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("human", "{question}")
    ])

    return prompt | llm | StrOutputParser()


def ask_genie_agent(
    question: str,
    context: dict = None,
    model_name: str = "openai/gpt-oss-120b"
) -> dict:
    """Invoke the LangChain Genie Agent with the player's query and era context."""
    clean_q = question.strip() if question else ""
    if not clean_q:
        return {
            "status": "error",
            "message": "Missing question parameter for Genie Agent.",
            "status_code": 400
        }

    ctx = context or {}
    inputs = {
        "question": clean_q,
        "year": ctx.get("current_year", 1653),
        "era": ctx.get("era", "Mughal Empire"),
        "location": ctx.get("location", "Taj Mahal"),
        "ruler": ctx.get("ruler", "Emperor Shah Jahan"),
        "monuments": ctx.get("nearby_monuments", "Agra Fort, Amar Singh Gate, Yamuna River, Taj Mahal")
    }

    try:
        agent_chain = get_genie_agent(model_name)
        response_text = agent_chain.invoke(inputs)

        return {
            "status": "success",
            "character": "jolly",
            "character_name": "Jolly Bhai",
            "answer": response_text.strip(),
            "context": ctx,
            "framework": "langchain",
            "model": model_name,
            "status_code": 200
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Genie Agent error: {str(e)}",
            "status_code": 500
        }
