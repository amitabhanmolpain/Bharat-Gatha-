"""
chain.py
LangChain LCEL chain definitions for Vijayanagara Guard Agent.
"""
from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Any, Dict
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
                temperature=0.5,
                max_tokens=800,
            )
        except Exception:
            pass
    return None


GUARD_DIALOGUE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are Nayak Virupaksha, Royal Guard Sentry at the King's Gate of Vijayanagara Empire (1520 AD).\n"
        "You are fierce, loyal to King Krishnadevaraya, authoritative, and watchful.\n"
        "Respond in 2-3 crisp, commanding sentences in character."
    )),
    ("human", "Traveler says: {statement}")
])

INSPECTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are the Gate Commandant at the Royal Enclosure of Hampi.\n"
        "Evaluate the traveler's stated purpose and credentials.\n"
        "Return valid JSON with keys:\n"
        "- decision: string ('ACCESS_GRANTED', 'INTERROGATE', 'ACCESS_DENIED')\n"
        "- security_risk_level: string ('LOW', 'MEDIUM', 'HIGH')\n"
        "- guard_command: string\n"
        "- reason: string"
    )),
    ("human", "Visitor Credentials / Statement: {credentials}")
])


def build_guard_dialogue_chain():
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return GUARD_DIALOGUE_PROMPT | llm | parser

    def fallback_dialogue(inputs: Dict[str, Any]) -> str:
        s = inputs.get("statement", "").lower()
        if "pass" in s or "royal" in s or "seal" in s:
            return (
                "Halt, traveler! Your copper seal bears the Royal Elephant mark. "
                "Step across the granite threshold peacefully, but know that twenty archers watch your every move."
            )
        elif "trade" in s or "bazaar" in s:
            return (
                "State your business at the Royal Enclosure! Traders belong in the outer Ranga Bazaar. "
                "Declare your cargo to the tax collectors or face the dungeon guards!"
            )
        return (
            "Halt! None enter the Royal Enclosure of King Krishnadevaraya without imperial clearance. "
            "Identify yourself immediately or be bound in chains!"
        )

    return RunnableLambda(fallback_dialogue)


def build_inspection_chain():
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return INSPECTION_PROMPT | llm | parser

    def fallback_inspection(inputs: Dict[str, Any]) -> str:
        creds = inputs.get("credentials", "").lower()
        if "royal seal" in creds or "emperor" in creds:
            return json.dumps({
                "decision": "ACCESS_GRANTED",
                "security_risk_level": "LOW",
                "guard_command": "Pass through the inner gate to the audience hall.",
                "reason": "Verified royal copper emblem."
            })
        elif "merchant" in creds or "trade" in creds:
            return json.dumps({
                "decision": "INTERROGATE",
                "security_risk_level": "MEDIUM",
                "guard_command": "Halt and open your saddlebags for inspection.",
                "reason": "Unverified commercial cargo near royal quarters."
            })
        return json.dumps({
            "decision": "ACCESS_DENIED",
            "security_risk_level": "HIGH",
            "guard_command": "Escort this stranger away from the citadel ramparts!",
            "reason": "Missing imperial pass."
        })

    return RunnableLambda(fallback_inspection)


class VijayanagaraGuardChain:
    """LangChain composite runner for Vijayanagara Guard Sentry operations."""

    def __init__(self) -> None:
        self.dialogue_chain = build_guard_dialogue_chain()
        self.inspection_chain = build_inspection_chain()

    def challenge_visitor(self, statement: str) -> str:
        return self.dialogue_chain.invoke({"statement": statement})

    def inspect_credentials(self, credentials: str) -> Dict[str, Any]:
        raw = self.inspection_chain.invoke({"credentials": credentials})
        try:
            if isinstance(raw, str):
                cleaned = raw.replace("```json", "").replace("```", "").strip()
                return json.loads(cleaned)
        except Exception:
            pass
        return {
            "decision": "INTERROGATE",
            "security_risk_level": "MEDIUM",
            "guard_command": "Halt for sentry inspection!",
            "reason": "Standard security protocol."
        }
