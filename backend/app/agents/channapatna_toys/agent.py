"""
agent.py
Channapatna Toys Master Agent implementation.
"""
from __future__ import annotations

from typing import Dict, Any

try:
    from .chain import ChannapatnaToysChain
except ImportError:
    from chain import ChannapatnaToysChain


class ChannapatnaToysMasterAgent:
    """
    Channapatna Wooden Toys Master Artisan AI Agent powered by LangChain.
    Guides toy design, wood selection, natural dye formulation, and heritage craft.
    """

    VERSION = "1.0.0"

    def __init__(self, artisan_name: str = "Master Craftsman Basha") -> None:
        self.artisan_name = artisan_name
        self.chain = ChannapatnaToysChain()

    def craft_toy_blueprint(self, prompt: str) -> Dict[str, Any]:
        """Generate a complete craft blueprint for a custom wooden toy."""
        return self.chain.design_toy(prompt)

    def consult_craft_heritage(self, query: str) -> str:
        """Query artisan heritage and eco-friendly woodcraft details."""
        return self.chain.explain_heritage(query)

    def __repr__(self) -> str:
        return f"<ChannapatnaToysMasterAgent name={self.artisan_name!r}>"
