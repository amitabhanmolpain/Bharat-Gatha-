"""
agent.py
Vijayanagara Guard Agent implementation.
"""
from __future__ import annotations

from typing import Any

try:
    from .chain import VijayanagaraGuardChain
except ImportError:
    from chain import VijayanagaraGuardChain


class VijayanagaraGuardAgent:
    """
    Vijayanagara Royal Fort Guard Agent powered by LangChain.
    Enforces sentry protocol at the King's Gate of Hampi.
    """

    VERSION = "1.0.0"

    def __init__(self, guard_name: str = "Nayak Virupaksha") -> None:
        self.guard_name = guard_name
        self.chain = VijayanagaraGuardChain()

    def challenge(self, statement: str) -> str:
        """Challenge a visitor trying to enter the gate."""
        return self.chain.challenge_visitor(statement)

    def inspect(self, credentials: str) -> dict[str, Any]:
        """Perform formal credential inspection."""
        return self.chain.inspect_credentials(credentials)

    def __repr__(self) -> str:
        return f"<VijayanagaraGuardAgent name={self.guard_name!r}>"
