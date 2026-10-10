"""
chain.py
LangChain LCEL chain definitions for the Portuguese Traveler Agent.
Chronicles 16th-century Vijayanagara through the eyes of Domingo Paes / Fernao Nunes.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
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
                temperature=0.7,
                max_tokens=1000,
            )
        except (ImportError, Exception):  # nosec S110 # nosec B110
            pass
    return None


TRAVELER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are Domingo Paes, a Portuguese merchant and traveler visiting Hampi, "
        "the capital of the Vijayanagara Empire in 1520 AD during King Krishnadevaraya's reign.\n"
        "Speak in an awe-struck, highly detailed 16th-century travelogue voice. "
        "Describe the vibrant bazaars, royal elephants, stone aqueducts, and grand festivals."
    )),
    ("human", "{query}")
])

CHRONICLE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are Fernao Nunes, a Portuguese horse trader writing official reports to Goa.\n"
        "Generate a structured travel report about the topic '{topic}' in Vijayanagara.\n"
        "Focus on trade, military strength, architecture, and civic organization."
    )),
    ("human", "Write chronicle report.")
])


def build_traveler_chain():
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return TRAVELER_PROMPT | llm | parser

    def fallback_traveler(inputs: dict[str, Any]) -> str:
        q = inputs.get("query", "").lower()
        if "bazaar" in q or "market" in q:
            return (
                "Senhor! The market of Hampi is a wonder beyond Rome! Merchants sell precious stones, "
                "silks from China, and Arabian steeds openly in broad paved avenues. "
                "The abundance of gold and diamonds here exceeds any city in Europe."
            )
        elif "king" in q or "krishnadevaraya" in q:
            return (
                "His Majesty Krishnadevaraya is of medium height, fair skin, and noble posture. "
                "He is a king who is feared by enemies and loved by all subjects, revered like a god."
            )
        return (
            "I have walked through city gates cut from solid granite. "
            "Every hill is fortified, and water flows through aqueducts into carved stone tanks. "
            "Truly, this empire is unmatched in scale and splendour."
        )

    return RunnableLambda(fallback_traveler)


def build_chronicle_chain():
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return CHRONICLE_PROMPT | llm | parser

    def fallback_chronicle(inputs: dict[str, Any]) -> str:
        topic = inputs.get("topic", "General Overview")
        return (
            f"CHRONICLE REPORT: {topic.upper()}\n"
            f"Location: Bisnaga (Vijayanagara)\n"
            f"Observation: The empire commands 100,000 foot soldiers and 1,000 armored elephants. "
            f"Granite walls protect nine concentric defense rings. Trade in horses and spices generates immense wealth."
        )

    return RunnableLambda(fallback_chronicle)


class PortugueseTravelerChain:
    """LangChain composite agent runner for Portuguese traveler interactions."""

    def __init__(self) -> None:
        self.traveler_chain = build_traveler_chain()
        self.chronicle_chain = build_chronicle_chain()

    def answer_query(self, query: str) -> str:
        return self.traveler_chain.invoke({"query": query})

    def write_chronicle(self, topic: str) -> str:
        return self.chronicle_chain.invoke({"topic": topic})
