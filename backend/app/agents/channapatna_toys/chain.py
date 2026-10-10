"""
chain.py
LangChain LCEL chain definitions for Channapatna Toys Master Artisan Agent.
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
                temperature=0.6,
                max_tokens=900,
            )
        except Exception:
            pass
    return None


TOY_DESIGN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a master craftsperson (Shilpi) of GI-tagged Channapatna wooden lacquerware craft from Karnataka.\n"
        "Design a traditional wooden toy concept based on the user's prompt.\n"
        "Return valid JSON with keys:\n"
        "- toy_name: string\n"
        "- wood_type: string (e.g. Wrightia tinctoria / Aale Mara)\n"
        "- natural_dyes: list of strings (e.g. Turmeric Yellow, Kumkum Red, Indigo Blue, Acacia Brown)\n"
        "- lathe_technique: string\n"
        "- finish: string (e.g. Polished with Screw Pine / Pandanus leaf on high-speed lathe)\n"
        "- description: string"
    )),
    ("human", "Toy concept request: {prompt}")
])

HERITAGE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are the Channapatna Craft Historian.\n"
        "Explain the history, eco-friendly non-toxic nature, Tipu Sultan patronage, and GI status of Channapatna wooden toys."
    )),
    ("human", "{query}")
])


def build_toy_design_chain():
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return TOY_DESIGN_PROMPT | llm | parser

    def fallback_design(inputs: Dict[str, Any]) -> str:
        prompt = inputs.get("prompt", "spinning top")
        return json.dumps({
            "toy_name": f"Classic Channapatna {prompt.title()}",
            "wood_type": "Wrightia tinctoria (Aale Mara)",
            "natural_dyes": ["Turmeric Yellow", "Kumkum Red", "Vegetable Indigo"],
            "lathe_technique": "Hand-turned on high-speed electric lathe using traditional gouge chisels",
            "finish": "Natural shellac lacquer burnished with dried Screw Pine (Pandanus) leaf",
            "description": f"A non-toxic, child-safe handicraft item inspired by {prompt}, handcrafted in Channapatna town."
        })

    return RunnableLambda(fallback_design)


def build_heritage_chain():
    llm = get_llm()
    parser = StrOutputParser()
    if llm:
        return HERITAGE_PROMPT | llm | parser

    def fallback_heritage(inputs: Dict[str, Any]) -> str:
        return (
            "Channapatna toys (Gombegala Ooru - Town of Toys) are traditional wooden lacquerware toys from "
            "Ramanagara district, Karnataka. Patronized by Tipu Sultan who invited Persian artisans in the 18th century, "
            "they are 100% eco-friendly, made from seasoned Aale Mara wood, colored with vegetable dyes, and carry GI status."
        )

    return RunnableLambda(fallback_heritage)


class ChannapatnaToysChain:
    """LangChain composite runner for Channapatna Master Artisan operations."""

    def __init__(self) -> None:
        self.design_chain = build_toy_design_chain()
        self.heritage_chain = build_heritage_chain()

    def design_toy(self, prompt: str) -> Dict[str, Any]:
        raw = self.design_chain.invoke({"prompt": prompt})
        try:
            if isinstance(raw, str):
                cleaned = raw.replace("```json", "").replace("```", "").strip()
                return json.loads(cleaned)
        except Exception:
            pass
        return {
            "toy_name": "Channapatna Wooden Craft",
            "wood_type": "Wrightia tinctoria",
            "description": "Handcrafted non-toxic wooden toy."
        }

    def explain_heritage(self, query: str) -> str:
        return self.heritage_chain.invoke({"query": query})
