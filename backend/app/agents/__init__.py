"""Bharat Gatha AI Agents Module.

This package contains all in-game intelligent conversational agents,
guardrail engines, and era-aware historical prompt pipelines:

1. Genie Agent (Jolly Bhai):
   - Multi-campaign historical storytelling companion.
   - Guardrails against off-topic queries and campaign spoiler protection
     (e.g., Kuldhara abandonment deduction and Bhangarh Fort curse secrets).
   - Dynamic behavior classification: 'glowing' for architectural/historical lore,
     'shaking' for urgent puzzle clues, and 'normal' for regular dialogue.

2. Guard Agent (Amar Singh Gate Sentry):
   - Commanding, authoritative Royal Mughal sentry protecting the inner sanctum.
   - Sentry security guardrails, profanity filtering, and warning escalation.

3. Base Agent Utilities:
   - Shared model configuration, prompt sanitization, and interface utilities.
"""

from app.agents.base_agent import (
    get_default_llm_model,
    sanitize_input_text,
)

from app.agents.genie_agent import (
    get_genie_agent,
    ask_genie_agent,
    resolve_campaign_context,
    classify_genie_behavior,
    CAMPAIGN_REGISTRY,
)

from app.agents.guard_agent import (
    get_guard_agent,
    ask_guard_agent,
    verify_fact_grounding,
)

__all__ = [
    # Base utilities
    "get_default_llm_model",
    "sanitize_input_text",
    # Genie Agent
    "get_genie_agent",
    "ask_genie_agent",
    "resolve_campaign_context",
    "classify_genie_behavior",
    "CAMPAIGN_REGISTRY",
    # Guard Agent
    "get_guard_agent",
    "ask_guard_agent",
    "verify_fact_grounding",
]

