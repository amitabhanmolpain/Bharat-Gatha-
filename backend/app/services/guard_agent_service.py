"""Backward-compatibility proxy for app.agents.guard_agent.

All AI agent logic has been organized into the dedicated `app.agents` module.
This file re-exports the Guard Agent interface to maintain 100% backward compatibility.
"""

from app.agents.guard_agent import (
    get_guard_agent,
    ask_guard_agent,
)

__all__ = [
    "get_guard_agent",
    "ask_guard_agent",
]
