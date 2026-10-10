"""
chain.py
LangChain LCEL chain definitions for Chowka Bara (Ancient Indian Board Game) AI Agent.
"""
from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Any, Dict, List
from dotenv import load_dotenv

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def get_llm():
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ")
    if api_key:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                model="openai/gpt-oss-120b",
                api_key=api_key,
                temperature=0.4,
                max_tokens=800,
            )
        except Exception:
            pass
    return None


STRATEGY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert master of Chowka Bara (5x5 ancient Indian board game using cowrie shells).\n"
        "Evaluate the current board state and cowrie roll result to recommend the optimal pawn move.\n"
        "Return valid JSON with keys:\n"
        "- recommended_move: string (e.g. 'Pawn 1 from Home to Safe Cell 1')\n"
        "- roll_value: int\n"
        "- capture_opportunity: bool\n"
        "- tactical_reasoning: string\n"
        "- commentary: string"
    )),
    ("human", "Board State: {board_state}\nCowrie Roll: {roll}")
])

RULE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are the Chowka Bara Rule Master. Explain traditional rules clearly for the user's question.\n"
        "Explain safe cells ('gatta'), cowrie rolls (1, 2, 3, 4, 8=Chakka, 12=Bara), capture mechanics, and inner square entry."
    )),
    ("human", "{question}")
])


def build_strategy_chain():
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return STRATEGY_PROMPT | llm | parser

    def fallback_strategy(inputs: Dict[str, Any]) -> str:
        roll = inputs.get("roll", 4)
        return json.dumps({
            "recommended_move": f"Advance Pawn 1 by {roll} cells along outer path",
            "roll_value": roll,
            "capture_opportunity": False,
            "tactical_reasoning": "Secure outer perimeter control before advancing towards the inner square.",
            "commentary": f"A solid roll of {roll}! Move forward and stay on safe squares ('gatta') whenever possible."
        })

    return RunnableLambda(fallback_strategy)


def build_rule_chain():
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return RULE_PROMPT | llm | parser

    def fallback_rule(inputs: Dict[str, Any]) -> str:
        q = inputs.get("question", "").lower()
        if "safe" in q or "gatta" in q:
            return (
                "Safe cells (marked with an X or cross) are 'Gatta'. Pawns on safe cells cannot be captured "
                "by opponent pawns regardless of rolls."
            )
        elif "roll" in q or "cowrie" in q:
            return (
                "Chowka Bara uses 4 cowrie shells. Mouths up count as score: 1, 2, 3, 4. "
                "All 4 mouths down = 8 (Chakka), all 4 mouths up = 12 (Bara). Extra turn awarded on 8 or 12!"
            )
        return (
            "Chowka Bara is played on a 5x5 grid. Each player moves 4 pawns counter-clockwise around the outer ring, "
            "captures an opponent pawn to unlock the inner ring, and reaches the central cell ('Mane') to win."
        )

    return RunnableLambda(fallback_rule)


class ChowkaBaraChain:
    """LangChain composite runner for Chowka Bara game master operations."""

    def __init__(self) -> None:
        self.strategy_chain = build_strategy_chain()
        self.rule_chain = build_rule_chain()

    def analyze_move(self, board_state: Dict[str, Any], roll: int) -> Dict[str, Any]:
        raw = self.strategy_chain.invoke({"board_state": json.dumps(board_state), "roll": roll})
        try:
            if isinstance(raw, str):
                cleaned = raw.replace("```json", "").replace("```", "").strip()
                return json.loads(cleaned)
        except Exception:
            pass
        return {
            "recommended_move": f"Move pawn {roll} steps",
            "roll_value": roll,
            "tactical_reasoning": "Maintain safe positions.",
            "commentary": "Play with strategic focus!"
        }

    def explain_rule(self, question: str) -> str:
        return self.rule_chain.invoke({"question": question})
