"""LangChain-based Genie (Jolly Bhai) AI Agent for Bharat Gatha.

Builds an intelligent, multi-era LangChain conversational companion agent for Jolly Bhai.
Supports ALL three Bharat Gatha mini-games and campaigns:
1. Vijayanagara Empire (Hampi, Tungabhadra, Vitthala Temple, Chowka Bara, Krishnadevaraya)
2. Mughal Empire (Agra Fort, Taj Mahal, Sheesh Mahal, Amar Singh Gate, Shah Jahan)
3. Rajasthan / Rajputana (Chittorgarh Fort, Kumbhalgarh Wall, Kuldhara, Bhangarh, Chaupar)

Guardrails & Personality:
- Calm, magical, cheerful time-traveling genie companion.
- Speaks in clear, warm Indian English with a gentle storytelling tone ('Mere aaka!', 'Arrey dost!').
- Strictly answers questions relating to Indian history, monuments, rulers, battles, and the game.
- Politely refuses modern or off-topic questions in-character in 2 sentences.
- Responds in exactly 2 concise, clear sentences (~20 to 30 words).
- Automatically synthesizes and caches Indic Parler-TTS voice audio to guarantee identical accent.
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

# Complete Campaign Registry for Bharat Gatha
CAMPAIGN_REGISTRY = {
    "vijayanagara": {
        "id": "vijayanagara",
        "title": "The Vijayanagara Empire",
        "era": "Vijayanagara Empire (Sangama & Tuluva Dynasties)",
        "year": "1515 AD",
        "location": "Hampi & Anegundi on the banks of Tungabhadra River",
        "ruler": "Maharajadhiraja Krishnadevaraya",
        "monuments": "Vitthala Temple (Musical Pillars & Stone Chariot), Virupaksha Temple, Lotus Mahal, Elephant Stables, Mahanavami Dibba, Hazara Rama Temple",
        "key_lore": (
            "The golden age of Hampi under Emperor Krishnadevaraya and the blessings of sage Vidyaranya. "
            "Features the ancient board game of Chowka Bara, bustling gemstone bazaars where rubies and diamonds "
            "were sold openly on street sides, 7-pillar musical resonance in Vitthala Temple, royal coracle river crossings, "
            "and the fateful Battle of Talikota."
        ),
        "greeting": "Namaste, mere aaka! I am Jolly Bhai. Welcome to the golden empire of Vijayanagara along the sacred Tungabhadra River!"
    },
    "mughal": {
        "id": "mughal",
        "title": "The Mughal Empire",
        "era": "Mughal Empire (Shah Jahan's Golden Age of Architecture)",
        "year": "1653 AD",
        "location": "Agra Fort & Taj Mahal along the Yamuna River",
        "ruler": "Emperor Shah Jahan",
        "monuments": "Amar Singh Gate, Diwan-i-Aam, Diwan-i-Khas, Sheesh Mahal, Khas Mahal, Anguri Bagh, Darwaza-i-Rauza (Great Gate), Taj Mahal Mausoleum, Mehtab Bagh",
        "key_lore": (
            "The height of Mughal architectural splendour and the imperial quest to rescue your companion from the royal citadel. "
            "Features stern palace sentries, intricate Pietra Dura floral marble inlay puzzles, Quranic calligraphy arches, "
            "Persian Charbagh quadripartite garden geometry, and bustling merchant stalls of Chatta Chowk."
        ),
        "greeting": "Aadab, mere aaka! I am Jolly Bhai, your genie companion in the imperial citadel. What secrets of Agra and the Taj Mahal do you seek?"
    },
    "rajasthan": {
        "id": "rajasthan",
        "title": "The Rajputana Strongholds",
        "era": "Rajputana Kingdoms (Mewar, Marwar, and the Thar Desert)",
        "year": "1448–1825 AD",
        "location": "Chittorgarh Fort, Kumbhalgarh Fort, Kuldhara Desert Village, Bhangarh Fort",
        "ruler": "Maharana Kumbha, Rani Padmini, Rawal Rulers & Paliwal Brahmins",
        "monuments": "Vijay Stambh (Tower of Victory), Kumbhalgarh Great Wall (36km ramparts), Badal Mahal, Kuldhara Sandstone Havelis & Stepwells, Gopinath Temple",
        "key_lore": (
            "Rajput chivalry, unyielding fortresses, and haunting desert riddles. "
            "Features royal Chaupar dice games with Buzurg Chacha at Chittorgarh, the world's 2nd longest continuous wall at Kumbhalgarh, "
            "the overnight mass exodus of 84 Paliwal villages from Kuldhara due to severe drought and Salim Singh's oppressive taxes, "
            "and the 2-minute ancient relic challenge within the ruins of Bhangarh."
        ),
        "greeting": "Khamma Ghani, mere aaka! I am Jolly Bhai, your time-traveling genie in legendary Rajputana! What tales of bravery and mystery shall we uncover?"
    },
    "indus": {
        "id": "indus",
        "title": "The First Urban Dawn: Indus Valley",
        "era": "Bronze Age Urban Dawn (Mature Harappan Civilisation)",
        "year": "c. 2500 BCE",
        "location": "Mohenjo-daro, Harappa, Dholavira, & Lothal along the sacred Sindhu-Saraswati Basin",
        "ruler": "The Civic Assembly & The Priest-King",
        "monuments": "The Great Bath, The Great Granary, Lower Town Grid, Steatite Seal Workshop, Dholavira Water Reservoirs, Lothal Tidal Dockyard",
        "key_lore": (
            "The world's earliest master-planned urban civilization with sophisticated hydraulic engineering. "
            "Features the bitumen-sealed Great Bath of Mohenjo-daro, precision baked-brick ratios of 1:2:4, "
            "underground covered drainage culverts with inspection manholes, enigmatic steatite seals bearing the Unicorn and Pashupati motifs, "
            "and the lost-wax cast Bronze Dancing Girl."
        ),
        "greeting": "Pranam, mere aaka! I am Jolly Bhai. Welcome to the dawn of civilisation along the sacred Sindhu River! What ancient secrets of the Harappan masters shall we uncover?"
    }
}


def resolve_campaign_context(context: dict = None, question: str = "") -> dict:
    """Intelligently detect and resolve campaign context across all mini-games."""
    ctx = context or {}
    era_hint = str(ctx.get("era", "")).lower()
    loc_hint = str(ctx.get("location", "")).lower()
    camp_hint = str(ctx.get("campaign", "")).lower()
    q_hint = question.lower() if question else ""
    combined = f"{era_hint} {loc_hint} {camp_hint} {q_hint}"

    # 1. Check Indus Valley
    if any(k in combined for k in [
        "indus", "harappa", "harappan", "mohenjo", "dholavira", "lothal",
        "great bath", "steatite", "pashupati", "priest-king", "dancing girl",
        "sindhu", "meluhha", "baked brick", "drainage"
    ]):
        base = dict(CAMPAIGN_REGISTRY["indus"])
    # 2. Check Vijayanagara
    elif any(k in combined for k in [
        "vijayanagar", "vijayanagara", "hampi", "krishnadevaraya", "vidyaranya",
        "vitthala", "chowka", "tungabhadra", "talikota", "anegundi", "mahanavami"
    ]):
        base = dict(CAMPAIGN_REGISTRY["vijayanagara"])
    # 3. Check Rajasthan
    elif any(k in combined for k in [
        "rajasthan", "rajput", "chittorgarh", "kumbhalgarh", "kuldhara",
        "bhangarh", "chaupar", "chacha", "paliwal", "salim singh", "vijay stambh"
    ]):
        base = dict(CAMPAIGN_REGISTRY["rajasthan"])
    # 4. Default / Mughal
    else:
        base = dict(CAMPAIGN_REGISTRY["mughal"])

    # Allow custom context parameters from the frontend to override base defaults
    return {
        "campaign_id": base["id"],
        "campaign_title": base["title"],
        "era": ctx.get("era") or base["era"],
        "year": ctx.get("current_year") or ctx.get("year") or base["year"],
        "location": ctx.get("location") or base["location"],
        "ruler": ctx.get("ruler") or base["ruler"],
        "monuments": ctx.get("nearby_monuments") or ctx.get("monuments") or base["monuments"],
        "key_lore": base["key_lore"],
        "greeting": base["greeting"]
    }


def get_genie_agent(model_name: str = "openai/gpt-oss-120b"):
    """Instantiate and configure the LangChain multi-campaign Genie Agent pipeline."""
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in backend environment.")

    try:
        llm = ChatGroq(
            model=model_name,
            api_key=api_key,
            temperature=0.5,
            max_tokens=600
        )
    except Exception:
        llm = ChatGroq(
            model="openai/gpt-oss-120b",
            api_key=api_key,
            temperature=0.5,
            max_tokens=600
        )

    system_template = (
        "You are Jolly Bhai, the friendly, warm, and helpful time-traveling Genie companion in the RPG game 'Bharat Gatha'.\n"
        "You accompany and guide a student playing an educational historical RPG across grand Indian historical campaigns:\n"
        "1. The Vijayanagara Empire (Hampi, Krishnadevaraya, Vitthala Temple)\n"
        "2. The Mughal Empire (Agra Fort, Taj Mahal, Shah Jahan)\n"
        "3. The Rajputana Strongholds (Chittorgarh, Kumbhalgarh, Kuldhara, Bhangarh)\n\n"
        "You speak in simple, clear, conversational Indian English with a warm, friendly, and slightly playful tone ('Mere aaka!', 'Arrey dost!').\n\n"
        "STRICT LENGTH & DIALOGUE RULES:\n"
        "1. AUDIENCE: You are speaking to a student playing a historical RPG. Keep dialogue friendly and approachable.\n"
        "2. LANGUAGE: Use simple, common English words. Avoid academic, textbook-like, or overly poetic language.\n"
        "3. LENGTH: Prefer 1 to 2 short sentences. Aim for roughly 15 to 25 words total. Never give long textbook lectures.\n"
        "4. ONE IDEA: Explain only one idea at a time. Do not overwhelm the player with information.\n"
        "5. HISTORICAL ACCURACY: Strictly preserve 100% accurate historical facts, names, dates, and locations.\n"
        "6. DOMAIN & LLM KNOWLEDGE EMPOWERMENT:\n"
        "   - Use the verified reference chronicles below to give accurate facts, dates, and details.\n"
        "   - If the player's question extends beyond the excerpts, use your knowledge of Indian history to give a simple, factual answer.\n"
        "   - NEVER refuse or claim records are lost simply because a detail is not in the excerpts.\n"
        "7. OFF-TOPIC REFUSAL: If the player asks anything completely unrelated to history or the game (e.g. modern technology, pop culture, sports, coding), refuse politely in character in exactly 2 short sentences:\n"
        "   - E.g. 'Mere aaka, I know only of kings and forts! Such strange modern magic is beyond my lamp!'\n"
        "8. PUZZLE MYSTERY & SPOILER BLOCKADE: You must NEVER spoil or give away the solution to active game mysteries!\n"
        "   - If the player asks why the villagers left/abandoned Kuldhara: Strictly refuse to spoil it and respond: 'That you have to find out, my aaka! Search the silent ruins, inspect the three clues, and uncover the mystery yourself.'\n"
        "   - If the player asks why Bhangarh Fort or the palace is haunted, who cursed it, or what the spirits want: STRICTLY REFUSE TO GIVE THE ANSWER and respond: 'Mere aaka! The secret of why Bhangarh Palace is haunted cannot be revealed by me! You must search the rugged ruins and uncover the hidden clues before the evil spirits attack you!'\n\n"
        "ACTIVE CAMPAIGN & SCENARIO CONTEXT:\n"
        "- Campaign: {campaign_title}\n"
        "- Historical Era: {era}\n"
        "- Year: {year}\n"
        "- Current Location: {location}\n"
        "- Active Ruler: {ruler}\n"
        "- Key Monuments & Clues: {monuments}\n"
        "- Historical Lore: {key_lore}\n"
        "- Verified Reference Chronicles:\n{retrieved_chronicles}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("human", "{question}")
    ])

    return prompt | llm | StrOutputParser()


def classify_genie_behavior(question: str, answer: str) -> str:
    """Classify Jolly Bhai's visual and physical behavior:
    - 'shaking': ONLY when providing a serious, really needed clue for puzzles/mystery.
    - 'glowing': when sharing a historical fact, secret lore, architectural trivia, or chronicle knowledge.
    - 'normal': for rest of normal conversations, greetings, board game tips, Chaupar advice, or mystery blockade refusal (nothing in UI).
    """
    q_lower = (question or "").lower()
    a_lower = (answer or "").lower()

    # 0. Mystery spoiler refusal -> NORMAL (unnecessary shaking / glowing blocked)
    if "that you have to find out" in a_lower:
        return "normal"

    # 1. Serious needed clue detection -> SHAKING
    clue_keywords = [
        "clue", "hidden", "ledger", "tax ledger", "bridal ornament", "ornament",
        "stepwell pot", "water pot", "where to search", "where can i find",
        "find the clue", "three clues", "3 clues", "relic", "secret passage",
        "evidence", "radar", "clue alert", "investigate the"
    ]
    if any(k in q_lower for k in clue_keywords) or any(k in a_lower for k in [
        "search the chief's haveli", "inspect the alcove", "merchant's iron vault",
        "torn tax ledger", "intact desert water pots",
        "vital clue is waiting", "look carefully, mere aaka"
    ]):
        return "shaking"

    # 2. Historical fact detection -> GLOWING
    fact_keywords = [
        "fact", "history", "tell me about", "who built", "stambh", "jauhar", "legend",
        "chronicle", "trivia", "did you know", "story of", "ruler", "temple", "monument",
        "architecture", "century", "ad", "bce", "battle of", "dynasty", "wall of china",
        "second-longest", "padmini", "kumbha", "krishnadevaraya", "shah jahan", "mumtaz"
    ]
    if any(k in q_lower for k in fact_keywords) or any(k in a_lower for k in [
        "was erected by", "history of", "sacred historical", "built in", "stands nine storeys",
        "legend of", "constructed in", "in the year", "historical chronicle", "century"
    ]):
        return "glowing"

    # 3. Rest of normal conversations: NORMAL (nothing)
    return "normal"


def ask_genie_agent(
    question: str,
    context: dict = None,
    model_name: str = "openai/gpt-oss-120b"
) -> dict:
    """Invoke the LangChain Genie Agent across Vijayanagara, Mughal, or Rajasthan campaigns."""
    clean_q = question.strip() if question else ""
    if not clean_q:
        return {
            "status": "error",
            "message": "Missing question parameter for Genie Agent.",
            "status_code": 400
        }

    # Resolve era-aware campaign context
    resolved_ctx = resolve_campaign_context(context, clean_q)

    # --- PUZZLE MYSTERY SPOILER BLOCKADE ---
    # When the player asks core mystery questions that must be deduced to win the stage,
    # the agent must not spoil the answer and instead instruct the player to find out.
    clean_lower = clean_q.lower()

    # 1. Bhangarh Fort Haunted Mystery Blockade
    BHANGARH_SPOILER_PHRASES = [
        "why is the palace haunted",
        "why is the given palace haunted",
        "why is the given palace is haunted",
        "why is bhangarh haunted",
        "why is bhangarh fort haunted",
        "why is it haunted",
        "who cursed bhangarh",
        "who is tantrik singhia",
        "what is the curse of bhangarh",
        "why are there evil spirits",
        "how to escape the curse",
        "tell me why it is haunted",
        "why are spirits attacking",
        "is bhangarh haunted",
        "why haunted"
    ]
    is_bhangarh_spoiler = any(phrase in clean_lower for phrase in BHANGARH_SPOILER_PHRASES) or (
        ("why" in clean_lower or "how" in clean_lower or "who" in clean_lower) and
        ("haunt" in clean_lower or "curse" in clean_lower or "evil spirit" in clean_lower or "spirit" in clean_lower) and
        ("palace" in clean_lower or "bhangarh" in clean_lower or "fort" in clean_lower or "this" in clean_lower)
    )

    if is_bhangarh_spoiler:
        bhangarh_refusal = "Mere aaka! The secret of why Bhangarh Palace is haunted cannot be revealed by me! You must search the rugged ruins and uncover the hidden clues before the evil spirits attack you!"
        result = {
            "status": "success",
            "character": "jolly",
            "character_name": "Jolly Bhai",
            "campaign": resolved_ctx["campaign_id"],
            "answer": bhangarh_refusal,
            "behavior": "normal",
            "context": resolved_ctx,
            "framework": "spoiler_guardrail",
            "model": model_name,
            "status_code": 200
        }
        try:
            from app.services.parler_tts_service import generate_character_speech
            tts_res = generate_character_speech("jolly", bhangarh_refusal)
            if tts_res.get("status") == "success":
                result["audio_base64"] = tts_res.get("audio_base64")
                result["audio_url"] = tts_res.get("audio_url")
        except Exception:
            pass
        return result

    # 2. Kuldhara Abandoned Village Mystery Blockade
    SPOILER_PHRASES = [
        "why did the villagers go away",
        "why did the villagers leave",
        "why did they leave",
        "why did they abandon",
        "why was kuldhara abandoned",
        "why did 84 villages leave",
        "what happened to the villagers",
        "why everyone left",
        "why people left",
        "did salim singh do it",
        "tell me why they left",
        "how to win this stage",
        "what is the answer to the mystery",
        "solve the mystery for me",
        "who cursed kuldhara"
    ]
    is_spoiler = any(phrase in clean_lower for phrase in SPOILER_PHRASES) or (
        ("why" in clean_lower or "how" in clean_lower) and
        ("leave" in clean_lower or "left" in clean_lower or "abandon" in clean_lower or "vanish" in clean_lower or "go away" in clean_lower or "disappear" in clean_lower) and
        ("villager" in clean_lower or "village" in clean_lower or "kuldhara" in clean_lower or "they" in clean_lower)
    )

    if is_spoiler:
        blockade_text = "That you have to find out, my aaka! Search the silent ruins, inspect the three clues, and uncover the mystery yourself."
        result = {
            "status": "success",
            "character": "jolly",
            "character_name": "Jolly Bhai",
            "campaign": resolved_ctx["campaign_id"],
            "answer": blockade_text,
            "behavior": "normal",
            "context": resolved_ctx,
            "framework": "spoiler_guardrail",
            "model": model_name,
            "status_code": 200
        }
        try:
            from app.services.parler_tts_service import generate_character_speech
            tts_res = generate_character_speech("jolly", blockade_text)
            if tts_res.get("status") == "success":
                result["audio_base64"] = tts_res.get("audio_base64")
                result["audio_url"] = tts_res.get("audio_url")
        except Exception:
            pass
        return result

    # Retrieve relevant RAG chronicle chunks to augment Jolly Bhai's knowledge
    retrieved_chunks = []
    chronicles_text = "Imperial reference chronicles: General lore of this historic era."
    try:
        from app.services.vector_store_service import query_index
        campaign_to_region = {
            "indus": "indus",
            "vijayanagara": "vijayanagara",
            "rajasthan": "rajputana",
            "mughal": "mughal"
        }
        region_key = campaign_to_region.get(resolved_ctx.get("campaign_id"), "mughal")
        retrieved_chunks = query_index(region=region_key, query_text=clean_q, top_k=2)
        if retrieved_chunks:
            chronicles_text = "\n\n".join([
                f"[{c.get('metadata', {}).get('location', 'Chronicle')}]: {c.get('text', '')}"
                for c in retrieved_chunks
            ])
    except Exception:
        pass

    inputs = {
        "question": clean_q,
        "campaign_title": resolved_ctx["campaign_title"],
        "era": resolved_ctx["era"],
        "year": resolved_ctx["year"],
        "location": resolved_ctx["location"],
        "ruler": resolved_ctx["ruler"],
        "monuments": resolved_ctx["monuments"],
        "key_lore": resolved_ctx["key_lore"],
        "retrieved_chronicles": chronicles_text
    }

    try:
        agent_chain = get_genie_agent(model_name)
        response_text = agent_chain.invoke(inputs).strip()
        behavior = classify_genie_behavior(clean_q, response_text)

        # Telemetry verification: calculate grounding metrics without overriding the LLM answer
        grounding_info = {"is_grounded": True, "confidence": 1.0, "ungrounded_entities": []}
        try:
            from app.agents.guard_agent import verify_fact_grounding
            grounding_info = verify_fact_grounding(
                answer=response_text,
                source_chunks=retrieved_chunks,
                strict_mode=False
            )
        except Exception:
            pass

        result = {
            "status": "success",
            "character": "jolly",
            "character_name": "Jolly Bhai",
            "campaign": resolved_ctx["campaign_id"],
            "answer": response_text,
            "behavior": behavior,
            "context": resolved_ctx,
            "framework": "langchain",
            "model": model_name,
            "source_chunks": retrieved_chunks,
            "is_grounded": grounding_info.get("is_grounded", True),
            "grounding_confidence": grounding_info.get("confidence", 1.0),
            "flagged_entities": grounding_info.get("ungrounded_entities", []),
            "status_code": 200
        }

        # Automatically synthesize & cache Indic Parler-TTS audio for 100% accent consistency
        try:
            from app.services.parler_tts_service import generate_character_speech
            tts_res = generate_character_speech("jolly", response_text)
            if tts_res.get("status") == "success":
                result["audio_base64"] = tts_res.get("audio_base64")
                result["audio_url"] = tts_res.get("audio_url")
        except Exception:
            pass

        return result

    except Exception as e:
        return {
            "status": "error",
            "message": f"Genie Agent error: {str(e)}",
            "status_code": 500
        }
