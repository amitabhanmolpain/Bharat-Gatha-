"""Backward-compatibility proxy for app.agents.genie_agent.

All AI agent logic has been organized into the dedicated `app.agents` module.
This file re-exports the Genie Agent interface to maintain 100% backward compatibility.
"""

from app.agents.genie_agent import (
    get_genie_agent,
    ask_genie_agent,
    resolve_campaign_context,
    classify_genie_behavior,
    CAMPAIGN_REGISTRY,
)

__all__ = [
    "get_genie_agent",
    "ask_genie_agent",
    "resolve_campaign_context",
    "classify_genie_behavior",
    "CAMPAIGN_REGISTRY",
]
