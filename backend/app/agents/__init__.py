"""Bharat Gatha AI Agents Module.

This package contains all in-game intelligent conversational agents,
guardrail engines, era-aware historical prompt pipelines, and standalone agent modules:

1. Genie Agent (Jolly Bhai):
   - Multi-campaign historical storytelling companion.

2. Guard Agent (Amar Singh Gate Sentry):
   - Commanding, authoritative Royal Mughal sentry protecting the inner sanctum.

3. Game Generator Package (GameGeneratorAgent & GameGeneratorChain):
   - LangChain LCEL pipeline for dynamic game blueprint generation.

4. Portuguese Traveler Agent (PortugueseTravelerAgent):
   - LangChain agent observing 16th-century Vijayanagara Empire (Domingo Paes).

5. Chowka Bara Game Agent (ChowkaBaraAgent):
   - LangChain agent executing ancient board game strategy & cowrie roll logic.

6. Channapatna Toys Master Agent (ChannapatnaToysMasterAgent):
   - LangChain master artisan agent designing GI-tagged lacquerware woodcraft.

7. Vijayanagara Guard Agent (VijayanagaraGuardAgent):
   - LangChain imperial sentry agent protecting the King's Gate at Hampi.
"""

try:
    from .base_agent import (
        get_default_llm_model,
        sanitize_input_text,
    )
    from .genie_agent import (
        CAMPAIGN_REGISTRY,
        ask_genie_agent,
        classify_genie_behavior,
        get_genie_agent,
        resolve_campaign_context,
    )
    from .guard_agent import (
        ask_guard_agent,
        get_guard_agent,
        verify_fact_grounding,
    )
except ImportError:
    from app.agents.base_agent import (
        get_default_llm_model,
        sanitize_input_text,
    )
    from app.agents.genie_agent import (
        CAMPAIGN_REGISTRY,
        ask_genie_agent,
        classify_genie_behavior,
        get_genie_agent,
        resolve_campaign_context,
    )
    from app.agents.guard_agent import (
        ask_guard_agent,
        get_guard_agent,
        verify_fact_grounding,
    )

__all__ = [
    "CAMPAIGN_REGISTRY",
    "ask_genie_agent",
    "ask_guard_agent",
    "classify_genie_behavior",
    "get_default_llm_model",
    "get_genie_agent",
    "get_guard_agent",
    "resolve_campaign_context",
    "sanitize_input_text",
    "verify_fact_grounding",
]
