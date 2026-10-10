"""
agent.py
Portuguese Traveler Agent implementation.
"""
from __future__ import annotations

from typing import Any

try:
    from .chain import PortugueseTravelerChain
except ImportError:
    from chain import PortugueseTravelerChain


class PortugueseTravelerAgent:
    """
    16th-century Portuguese Traveler AI Agent powered by LangChain.
    Simulates Domingo Paes / Fernao Nunes observing Vijayanagara Empire.
    """

    VERSION = "1.0.0"

    def __init__(self, traveler_name: str = "Domingo Paes") -> None:
        self.traveler_name = traveler_name
        self.chain = PortugueseTravelerChain()

    def observe(self, query: str) -> str:
        """Return an in-character observation response."""
        return self.chain.answer_query(query)

    def generate_report(self, topic: str) -> dict[str, Any]:
        """Generate a structured historical travel report."""
        content = self.chain.write_chronicle(topic)
        return {
            "traveler": self.traveler_name,
            "era": "1520 AD",
            "location": "Vijayanagara (Hampi)",
            "topic": topic,
            "report_body": content,
        }

    def __repr__(self) -> str:
        return f"<PortugueseTravelerAgent name={self.traveler_name!r}>"
