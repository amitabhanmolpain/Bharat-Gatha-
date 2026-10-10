"""
agent.py
Chowka Bara Game Agent implementation.
"""
from __future__ import annotations

import random
from typing import Any

try:
    from .chain import ChowkaBaraChain
except ImportError:
    from chain import ChowkaBaraChain


class ChowkaBaraAgent:
    """
    Chowka Bara Ancient Indian Board Game Master Agent powered by LangChain.
    Simulates cowrie shell rolling, move evaluations, and rule guidance.
    """

    VERSION = "1.0.0"

    def __init__(self, player_name: str = "Grandmaster Shilpa") -> None:
        self.player_name = player_name
        self.chain = ChowkaBaraChain()

    def roll_cowries(self) -> dict[str, Any]:
        """Simulate rolling 4 cowrie shells."""
        shells = [random.choice([0, 1]) for _ in range(4)]  # nosec B311 # nosec S311
        score = sum(shells)
        if score == 0:
            value = 8
            name = "Chakka (8) - Extra Turn!"
        elif score == 4:
            value = 12
            name = "Bara (12) - Extra Turn!"
        else:
            value = score
            name = f"{value}"

        return {
            "shells": shells,
            "roll_value": value,
            "roll_name": name,
            "extra_turn": value in (8, 12),
        }

    def compute_best_move(self, board_state: dict[str, Any], roll: int) -> dict[str, Any]:
        """Use LangChain chain to evaluate strategic board position and pick move."""
        return self.chain.analyze_move(board_state, roll)

    def ask_rule(self, question: str) -> str:
        """Query traditional game rules."""
        return self.chain.explain_rule(question)

    def __repr__(self) -> str:
        return f"<ChowkaBaraAgent name={self.player_name!r}>"
