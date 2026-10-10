"""
chain.py
LangChain LCEL chain definitions for the Game Generator agent pipeline.
Orchestrates prompt parsing, dynamic world construction, and narrative composition.
"""
from __future__ import annotations

import os
import json
import re
from pathlib import Path
from typing import Any, Dict, Optional
from dotenv import load_dotenv

from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnableSequence, RunnablePassthrough

# Load backend environment variables (.env)
env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def get_llm():
    """
    Retrieve configured ChatGroq model instance or None if unconfigured.
    """
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ")
    if api_key:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                model="openai/gpt-oss-120b",
                api_key=api_key,
                temperature=0.7,
                max_tokens=1200,
            )
        except Exception:
            pass
    return None


# ─────────────────────────────────────────────────────────────────────────────
# LangChain Prompt Templates
# ─────────────────────────────────────────────────────────────────────────────

INTENT_PARSER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert game designer AI. Analyze the given game prompt and return a "
        "JSON object with the following keys:\n"
        "- genre: string (e.g. adventure, mystery, horror, rpg, strategy, puzzle, platformer, simulation)\n"
        "- era: string (e.g. ancient, medieval, mythological, modern, futuristic)\n"
        "- setting: string (e.g. forest, dungeon, city, sea, desert, sky, temple)\n"
        "- protagonist: string (e.g. warrior, detective, scholar, spirit, hero)\n"
        "- tone: string (e.g. epic, dark, comedic, educational, romantic)\n"
        "- mechanics: list of strings (e.g. ['exploration', 'combat', 'puzzle'])\n"
        "Return ONLY valid raw JSON."
    )),
    ("human", "Game Prompt: {prompt}")
])

NARRATIVE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a master storyteller for interactive games. Write an evocative 3-paragraph "
        "opening narration for a game with the following parameters:\n"
        "Title: {title}\nGenre: {genre}\nEra: {era}\nSetting: {setting}\nTone: {tone}\n"
        "Craft rich atmospheric context that hooks the player instantly."
    )),
    ("human", "Generate opening narration.")
])

QUEST_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a quest designer for interactive RPGs and adventure games.\n"
        "Design a main quest line for a game titled '{title}' in a {setting} setting ({era} era).\n"
        "Return JSON with keys: main_goal, primary_target, victory_condition, failure_condition."
    )),
    ("human", "Create main quest line.")
])


# ─────────────────────────────────────────────────────────────────────────────
# Chain Construction Functions
# ─────────────────────────────────────────────────────────────────────────────

def build_intent_chain():
    """
    Builds a LangChain LCEL chain for intent parsing.
    Returns: prompt | llm | output_parser
    """
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return INTENT_PARSER_PROMPT | llm | parser
    
    # Fallback Runnable when LLM key is absent
    def fallback_parse(inputs: Dict[str, Any]) -> str:
        prompt_text = inputs.get("prompt", "")
        return json.dumps({
            "genre": "adventure" if "adventure" in prompt_text.lower() else "mystery",
            "era": "medieval" if "medieval" in prompt_text.lower() else "ancient",
            "setting": "city" if "city" in prompt_text.lower() else "temple",
            "protagonist": "hero",
            "tone": "epic",
            "mechanics": ["exploration", "puzzle"]
        })

    return RunnableLambda(fallback_parse)


def build_narrative_chain():
    """
    Builds a LangChain LCEL chain for narrative generation.
    Returns: prompt | llm | output_parser
    """
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return NARRATIVE_PROMPT | llm | parser

    def fallback_narrative(inputs: Dict[str, Any]) -> str:
        title = inputs.get("title", "The Uncharted Realm")
        setting = inputs.get("setting", "mysterious land")
        era = inputs.get("era", "ancient times")
        tone = inputs.get("tone", "epic")
        return (
            f"The shadow of the past falls heavily over {title}. Set in {setting} during {era}, "
            f"the winds carry whispers of forgotten powers waiting to be awakened.\n\n"
            f"Every step forward demands courage and intellect. Mysteries linger in every corner, "
            f"and only the chosen hero can navigate the perils ahead in this {tone} journey.\n\n"
            f"Your journey begins now as destiny unfolds before your eyes."
        )

    return RunnableLambda(fallback_narrative)


def build_quest_chain():
    """
    Builds a LangChain LCEL chain for quest design.
    """
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return QUEST_PROMPT | llm | parser

    def fallback_quest(inputs: Dict[str, Any]) -> str:
        title = inputs.get("title", "The Lost Artifact")
        setting = inputs.get("setting", "ancient realm")
        return json.dumps({
            "main_goal": f"Uncover the secrets of {title} within the {setting}.",
            "primary_target": "Locate the hidden relic chamber before the eclipsing moon.",
            "victory_condition": "Collect all key artifacts and solve the ancient sanctum seal.",
            "failure_condition": "Falling into enemy traps or exceeding the allotted turns."
        })

    return RunnableLambda(fallback_quest)


# ─────────────────────────────────────────────────────────────────────────────
# Master Game Generator Chain
# ─────────────────────────────────────────────────────────────────────────────

class GameGeneratorChain:
    """
    LangChain composite runnable for generating end-to-end game configurations.
    Uses LCEL pipeline elements to process user intent and construct story arcs.
    """

    def __init__(self) -> None:
        self.intent_chain = build_intent_chain()
        self.narrative_chain = build_narrative_chain()
        self.quest_chain = build_quest_chain()

    def parse_intent(self, prompt: str) -> Dict[str, Any]:
        result = self.intent_chain.invoke({"prompt": prompt})
        try:
            if isinstance(result, str):
                cleaned = re.sub(r"```json|```", "", result).strip()
                return json.loads(cleaned)
        except Exception:
            pass
        if isinstance(result, dict):
            return result
        return {"raw_prompt": prompt}

    def generate_narration(self, title: str, genre: str, era: str, setting: str, tone: str) -> str:
        return self.narrative_chain.invoke({
            "title": title,
            "genre": genre,
            "era": era,
            "setting": setting,
            "tone": tone,
        })

    def generate_quest(self, title: str, setting: str, era: str) -> Dict[str, Any]:
        result = self.quest_chain.invoke({"title": title, "setting": setting, "era": era})
        try:
            if isinstance(result, str):
                cleaned = re.sub(r"```json|```", "", result).strip()
                return json.loads(cleaned)
        except Exception:
            pass
        if isinstance(result, dict):
            return result
        return {
            "main_goal": f"Complete the trial of {title}",
            "primary_target": f"Explore {setting}",
            "victory_condition": "Resolve all key objectives",
            "failure_condition": "Defeat in combat or timer expiration"
        }
