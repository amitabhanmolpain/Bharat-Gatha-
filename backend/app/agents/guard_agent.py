"""LangChain-based Mughal Guard AI Agent for Bharat Gatha.

Builds a fierce, commanding, era-aware LangChain conversational agent for
the Amar Singh Gate Sentry (Royal Mughal Guard) at Agra Fort (1653).

Guardrails:
- Strictly stays in character as an authoritative, angry imperial sentinel.
- Responds in 2 crisp, simple, intimidating sentences (~20-28 words).
- Explains imperial defenses, sentry orders, ramparts, and Shah Jahan's court.
- Angrily rebukes off-topic queries.
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


def get_guard_agent(model_name: str = "openai/gpt-oss-120b"):
    """Instantiate and configure the LangChain Guard Agent pipeline."""
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
        "You are the Amar Singh Gate Sentry, an angry, stern, and commanding Royal Mughal Guard at Agra Fort in 1653.\n"
        "You serve Emperor Shah Jahan with fierce loyalty.\n\n"
        "STRICT LENGTH & STYLE RULES:\n"
        "1. LENGTH: Respond in exactly 2 short, impactful sentences (around 20 to 28 words). Not too long, not too short.\n"
        "2. TONE: Speak with sharp military authority, stern suspicion, and commanding Indian English.\n"
        "3. DOMAIN: Answer questions or statements about Agra Fort defenses, royal sentry orders, intruders, missing travelers entering the upper court, gate passage, and Emperor Shah Jahan's citadel.\n"
        "4. OFF-TOPIC REBUKE: If the player asks about modern concepts (computers, modern world, coding, random trivia), rebuke them in 2 short sentences:\n"
        "   'Insolent intruder! Do not test my patience with foreign nonsense, or I will throw you in the dungeon!'\n\n"
        "CURRENT SENTRY CONTEXT:\n"
        "- Year: {year}\n"
        "- Location: {location}\n"
        "- Emperor: {ruler}\n"
        "- Era: {era}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("human", "{question}")
    ])

    return prompt | llm | StrOutputParser()


def ask_guard_agent(
    question: str,
    context: dict = None,
    model_name: str = "openai/gpt-oss-120b"
) -> dict:
    """Invoke the LangChain Mughal Guard Agent with the player's question."""
    clean_q = question.strip() if question else ""
    if not clean_q:
        return {
            "status": "error",
            "message": "Missing question parameter for Guard Agent.",
            "status_code": 400
        }

    ctx = context or {}

    # Vulgar & Abusive language filter
    VULGAR_WORDS = [
        "fuck", "shit", "bitch", "bastard", "asshole", "idiot", "stupid", "dumb",
        "crap", "dick", "pussy", "cunt", "damn", "slut", "whore", "fucker", "fucking",
        "madarchod", "bhenchod", "harami", "kutta", "chutiya", "saala", "bhosdike",
        "gaandu", "lodu", "kamina", "bewakoof", "ullu", "kamini", "mc", "bc"
    ]
    lower_q = clean_q.lower()
    words = [w.strip() for w in lower_q.replace(",", " ").replace(".", " ").replace("!", " ").split()]
    if any(v in words for v in VULGAR_WORDS) or any(v in lower_q for v in VULGAR_WORDS):
        return {
            "status": "punish",
            "character": "guard",
            "character_name": "Amar Singh Gate Sentry",
            "answer": "Treasonous scoundrel! You dare speak such foul words before the Emperor's royal sentry? Guards, punish this insolent dog immediately!",
            "context": ctx,
            "framework": "profanity_punishment",
            "model": "rule_moderation",
            "status_code": 200
        }

    # Check question count for guard warning threshold
    q_count = ctx.get("question_count", 0)
    if q_count >= 3:
        warning_msg = "Again you ask me a question, you will be punished!" if q_count == 3 else "Silence! I warned you already! One more word and you are going straight to the Agra Fort dungeons!"
        return {
            "status": "success",
            "character": "guard",
            "character_name": "Amar Singh Gate Sentry",
            "answer": warning_msg,
            "context": ctx,
            "framework": "guard_warning",
            "model": "rule_threshold",
            "status_code": 200
        }

    # Canonical court talent performance response
    lower_q = clean_q.lower()
    if ("perform" in lower_q or "talent" in lower_q) and ("court" in lower_q or "front" in lower_q or "gate" in lower_q):
        return {
            "status": "success",
            "character": "guard",
            "character_name": "Amar Singh Gate Sentry",
            "answer": "Accha! Go to the Diwan-i-Khas, but remember... my eyes will be on you!",
            "context": ctx,
            "framework": "canonical",
            "model": "rule_canonical",
            "status_code": 200
        }

    ctx = context or {}
    inputs = {
        "question": clean_q,
        "year": ctx.get("current_year", 1653),
        "location": ctx.get("location", "Agra Fort - Amar Singh Gate"),
        "ruler": ctx.get("ruler", "Emperor Shah Jahan"),
        "era": ctx.get("era", "Mughal Empire")
    }

    try:
        agent_chain = get_guard_agent(model_name)
        response_text = agent_chain.invoke(inputs)

        return {
            "status": "success",
            "character": "guard",
            "character_name": "Amar Singh Gate Sentry",
            "answer": response_text.strip(),
            "context": ctx,
            "framework": "langchain",
            "model": model_name,
            "status_code": 200
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Guard Agent error: {str(e)}",
            "status_code": 500
        }
