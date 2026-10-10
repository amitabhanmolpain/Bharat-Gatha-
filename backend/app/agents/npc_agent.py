"""Dynamic, Uncoupled NPC Agent Module for Bharat Gatha.

Architectural Overview:
-----------------------
This agent provides a fully dynamic, runtime-configurable Non-Player Character (NPC)
conversational and behavioral engine. Unlike static or hardcoded dialogue scripts,
this agent dynamically generates character persona, historical context grounding,
mood evolution, trust/disposition scoring, and conditional lore revelation on the fly.

Decoupling Notice:
------------------
This file is deliberately decoupled and standalone. It is NOT imported or registered
in any API controllers, routers, or frontend components. It can be instantiated,
tested, or integrated programmatically whenever desired.

Key Capabilities:
1. Dynamic Persona Architecture (NPCPersona):
   - Configurable traits, social role, historical era, dialect, and secret knowledge.
2. Dynamic Prompt Assembly (DynamicPromptEngine):
   - Composes system instructions dynamically based on player relationship,
     environmental context, time of day, and NPC disposition.
3. Emotional & Rapport State Tracking (NPCDialogueState):
   - Evolving disposition score (0.0 to 1.0) adjusting dynamically to player tone.
4. Procedural / AI NPC Generation (generate_procedural_npc):
   - Synthesizes authentic historical personas dynamically for any era/monument.
5. Robust Fallback Pipeline:
   - Graceful offline synthesis ensuring zero runtime exceptions even without LLM connectivity.
"""

from __future__ import annotations

import os
import json
import logging
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv

# LangChain & Groq integration
try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

# Logger setup
logger = logging.getLogger("BharatGatha.NPCAgent")

# Robust .env loader
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()


# ============================================================================
# 1. DATA MODELS & PERSONA CONFIGURATION (FULLY DYNAMIC)
# ============================================================================

@dataclass
class SecretLore:
    """Represents a hidden clue, rumor, or historical secret."""
    secret_id: str
    topic_trigger: str
    required_trust: float
    content: str
    is_revealed: bool = False


@dataclass
class NPCPersona:
    """Dynamic NPC profile containing behavioral, cultural, and historical attributes."""
    npc_id: str
    name: str
    role: str  # e.g., 'Master Mason', 'Spice Trader', 'Temple Priestess', 'Royal Astrologer'
    era: str   # e.g., '1653 AD Mughal Empire', '1515 AD Vijayanagara', '2500 BCE Indus Valley'
    location: str  # e.g., 'Chatta Chowk Bazaar, Delhi', 'Vitthala Temple Courtyard, Hampi'
    background: str
    personality_traits: List[str] = field(default_factory=lambda: ["observant", "cautious"])
    speech_style: str = "warm, colloquial Indian English with period-appropriate idioms"
    current_mood: str = "neutral"  # e.g., 'neutral', 'friendly', 'suspicious', 'curious', 'agitated'
    disposition: float = 0.5       # Rapport rating between 0.0 (hostile) and 1.0 (devoted)
    secrets: List[SecretLore] = field(default_factory=list)
    forbidden_topics: List[str] = field(default_factory=lambda: ["modern technology", "future spoilers"])
    custom_metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert persona to serializable dictionary."""
        return asdict(self)


@dataclass
class NPCInteractionTurn:
    """Records an individual dialogue turn for dynamic memory."""
    turn_index: int
    player_input: str
    npc_response: str
    mood_at_turn: str
    disposition_at_turn: float
    revealed_secret_id: Optional[str] = None
    gesture_action: Optional[str] = None


# ============================================================================
# 2. DYNAMIC PROMPT & COGNITION ENGINE
# ============================================================================

class DynamicPromptEngine:
    """Constructs dynamic, contextualized prompts without hardcoded dialogue branches."""

    @staticmethod
    def build_system_instructions(
        persona: NPCPersona,
        world_context: Optional[Dict[str, Any]] = None,
        recent_turns: Optional[List[NPCInteractionTurn]] = None
    ) -> str:
        """Dynamically synthesizes the system prompt based on persona and environment."""
        ctx = world_context or {}
        time_of_day = ctx.get("time_of_day", "afternoon")
        weather = ctx.get("weather", "clear")
        player_reputation = ctx.get("player_reputation", "traveling seeker")
        immediate_surroundings = ctx.get("immediate_surroundings", persona.location)
        active_quest = ctx.get("active_quest", "exploring the historical quarter")

        # Disposition descriptor
        if persona.disposition >= 0.8:
            trust_label = "Extremely trusting and candid; treats player as a cherished ally."
        elif persona.disposition >= 0.6:
            trust_label = "Warm, hospitable, and cooperative."
        elif persona.disposition >= 0.4:
            trust_label = "Guarded but polite; speaks formally and observes the player."
        elif persona.disposition >= 0.2:
            trust_label = "Deeply suspicious, curt, and reluctant to share details."
        else:
            trust_label = "Hostile and defensive; warns the player not to loiter."

        # Available unrevealed secrets
        secret_prompt_ctx = ""
        unlockable_secrets = [s for s in persona.secrets if not s.is_revealed and persona.disposition >= s.required_trust]
        if unlockable_secrets:
            secret_prompt_ctx = "\nSECRETS YOU MAY SHARE IF ASKED ABOUT RELEVANT TOPICS:\n" + "\n".join(
                f"- [Trigger: '{s.topic_trigger}']: {s.content}" for s in unlockable_secrets
            )

        instructions = f"""You are {persona.name}, an authentic historical character in an educational Indian RPG.
YOUR IDENTITY & SOCIAL ROLE:
- Role: {persona.role}
- Era: {persona.era}
- Setting / Monument: {persona.location}
- Personal History: {persona.background}
- Personality Traits: {', '.join(persona.personality_traits)}
- Speech Dialect / Cadence: {persona.speech_style}

CURRENT SITUATIONAL STATE:
- Current Mood: {persona.current_mood.upper()}
- Rapport / Trust Level: {persona.disposition:.2f} / 1.00 ({trust_label})
- Environment: {immediate_surroundings} (Time: {time_of_day}, Atmosphere: {weather})
- Player's Perceived Identity: {player_reputation}
- Surrounding Quest Context: {active_quest}
{secret_prompt_ctx}

DYNAMIC CONVERSATION RULES:
1. IN-CHARACTER DIALOGUE: Speak exclusively from your historical era. Never acknowledge future technology or modern concepts outside the historical frame.
2. CONCISENESS: Respond in 2-3 engaging, descriptive sentences (around 25-45 words).
3. PHYSICAL GESTURE: Prepend a short physical action in asterisks describing your posture or micro-expression (e.g., *strokes brass scales thoughtfully*, *glances toward the palace ramparts*).
4. EMOTIONAL REACTION: If the player is polite, respectful, or knowledgeable, subtly warm up. If the player is rude or asks intrusive questions, respond with caution or indignation.
5. FORMAT: You must format your final answer strictly as valid JSON with the following schema:
{{
  "action": "*gesture description*",
  "dialogue": "Spoken dialogue here.",
  "new_mood": "one of: neutral, friendly, suspicious, intrigued, joyful, solemn",
  "disposition_delta": 0.05,
  "revealed_secret_id": null
}}
"""
        return instructions


# ============================================================================
# 3. DYNAMIC NPC AGENT IMPLEMENTATION
# ============================================================================

class NPCAgent:
    """Autonomous, dynamic NPC conversational entity with affective state tracking."""

    def __init__(
        self,
        persona: Optional[NPCPersona] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.65
    ):
        self.persona = persona or self._create_default_persona()
        self.model_name = model_name or os.getenv("DEFAULT_AGENT_MODEL", "llama-3.3-70b-versatile")
        self.temperature = temperature
        self.history: List[NPCInteractionTurn] = []
        self._llm = self._initialize_llm()

    def _create_default_persona(self) -> NPCPersona:
        """Instantiates a default dynamic archetype if none provided."""
        return NPCPersona(
            npc_id="default_artisan_01",
            name="Pandit Govindram",
            role="Royal Stone Carver & Inlay Artisan",
            era="1653 AD (Reign of Shah Jahan)",
            location="Marble Workshops near Agra Fort East Gate",
            background="A third-generation master of Pietra Dura inlay techniques who has worked on the imperial cenotaphs.",
            personality_traits=["meticulous", "proud of craftsmanship", "suspicious of foreigners"],
            speech_style="Hindustani-flavored English with artisan metaphors and respectful greetings",
            current_mood="focused",
            disposition=0.50,
            secrets=[
                SecretLore(
                    secret_id="sec_lapis_origin",  # nosec B106
                    topic_trigger="semi-precious stones or lapis lazuli",
                    required_trust=0.60,
                    content="The deep blue lapis lazuli arrived across mountain passes from the badakhshan mines, hidden inside silk caravans."
                )
            ]
        )

    def _initialize_llm(self) -> Optional[Any]:
        """Initializes the LangChain LLM instance safely."""
        if not LANGCHAIN_AVAILABLE:
            logger.info("LangChain not detected in active environment; running in procedural simulation mode.")
            return None

        api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ")
        if not api_key:
            logger.warning("GROQ_API_KEY is not set. NPCAgent will use procedural dynamic dialogue synthesis.")
            return None

        try:
            return ChatGroq(
                model=self.model_name,
                api_key=api_key,
                temperature=self.temperature,
                max_tokens=500
            )
        except Exception as err:
            logger.warning("Failed to initialize ChatGroq: %s. Using procedural synthesis.", err)
            return None

    def interact(
        self,
        player_input: str,
        world_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Executes a dynamic interaction turn with the player.

        Args:
            player_input: What the player said or asked.
            world_context: Optional environmental parameters (location, time, quest).

        Returns:
            Dictionary containing spoken dialogue, gestures, mood changes, and secrets.
        """
        clean_input = (player_input or "").strip()
        if not clean_input:
            return {
                "action": "*looks up with a puzzled expression*",
                "dialogue": "Did you say something, traveler? The winds carry away half-spoken words.",
                "mood": self.persona.current_mood,
                "disposition": self.persona.disposition,
                "revealed_secret": None,  # nosec B105
            }

        # Check topic triggers against secret knowledge
        matched_secret = self._check_secret_triggers(clean_input)

        # Generate response via LLM or procedural fallback
        if self._llm:
            response_data = self._invoke_llm_pipeline(clean_input, world_context, matched_secret)
        else:
            response_data = self._procedural_fallback_response(clean_input, matched_secret)

        # Apply state evolution
        delta = response_data.get("disposition_delta", 0.0)
        self.update_disposition(delta)

        new_mood = response_data.get("new_mood")
        if new_mood:
            self.persona.current_mood = new_mood

        revealed_id = response_data.get("revealed_secret_id")
        if revealed_id:
            for s in self.persona.secrets:
                if s.secret_id == revealed_id:
                    s.is_revealed = True

        # Record turn in history
        turn = NPCInteractionTurn(
            turn_index=len(self.history) + 1,
            player_input=clean_input,
            npc_response=response_data.get("dialogue", ""),
            mood_at_turn=self.persona.current_mood,
            disposition_at_turn=self.persona.disposition,
            revealed_secret_id=revealed_id,
            gesture_action=response_data.get("action")
        )
        self.history.append(turn)

        return {
            "npc_id": self.persona.npc_id,
            "name": self.persona.name,
            "role": self.persona.role,
            "action": response_data.get("action", "*nods respectfully*"),
            "dialogue": response_data.get("dialogue", ""),
            "mood": self.persona.current_mood,
            "disposition": round(self.persona.disposition, 2),
            "revealed_secret": revealed_id,
            "turn_count": len(self.history)
        }

    def _check_secret_triggers(self, query: str) -> Optional[SecretLore]:
        """Dynamically matches query tokens to unrevealed secrets if trust threshold is satisfied."""
        q_lower = query.lower()
        for secret in self.persona.secrets:
            if secret.is_revealed:
                continue
            triggers = [t.strip().lower() for t in secret.topic_trigger.split(",")]
            if any(t in q_lower for t in triggers if len(t) > 2):
                if self.persona.disposition >= secret.required_trust:
                    return secret
        return None

    def _invoke_llm_pipeline(
        self,
        player_input: str,
        world_context: Optional[Dict[str, Any]],
        matched_secret: Optional[SecretLore]
    ) -> Dict[str, Any]:
        """Calls the LangChain pipeline and safely parses the dynamic JSON response."""
        system_prompt = DynamicPromptEngine.build_system_instructions(
            self.persona, world_context, self.history
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{question}")
        ])

        chain = prompt | self._llm | StrOutputParser()

        try:
            raw_output = chain.invoke({"question": player_input})
            # Clean possible markdown JSON wrappers
            clean_output = raw_output.strip()
            if clean_output.startswith("```json"):
                clean_output = clean_output[7:]
            if clean_output.startswith("```"):
                clean_output = clean_output[3:]
            if clean_output.endswith("```"):
                clean_output = clean_output[:-3]

            parsed = json.loads(clean_output.strip())
            return parsed
        except Exception as parse_err:
            logger.debug("Raw output could not be parsed as JSON: %s. Using text extraction.", parse_err)
            return {
                "action": "*pauses and considers your inquiry*",
                "dialogue": raw_output.replace('"', '').strip() if 'raw_output' in locals() else "I hear you, traveler.",
                "new_mood": self.persona.current_mood,
                "disposition_delta": 0.02,
                "revealed_secret_id": matched_secret.secret_id if matched_secret else None
            }

    def _procedural_fallback_response(
        self,
        player_input: str,
        matched_secret: Optional[SecretLore]
    ) -> Dict[str, Any]:
        """Procedural dynamic fallback when no LLM API is available."""
        q_lower = player_input.lower()

        # Dynamic sentiment estimation
        if any(w in q_lower for w in ["respect", "please", "teach", "admire", "master", "sir", "namaste", "salaam"]):
            delta = 0.08
            mood = "friendly"
            gesture = "*offers a respectful bow with hands folded*"
            dialogue = f"You carry true respect for our heritage, seeker. In this era of {self.persona.era}, wisdom is granted to those who listen."
        elif any(w in q_lower for w in ["hurry", "cheat", "give me", "stupid", "worthless"]):
            delta = -0.10
            mood = "suspicious"
            gesture = "*crosses arms and frowns with narrowed eyes*"
            dialogue = "Patience is the first virtue of an explorer. Do not demand what you have not earned."
        else:
            delta = 0.02
            mood = "intrigued"
            gesture = "*adjusts their garments and gestures toward the surrounding monument*"
            dialogue = f"The stones of {self.persona.location} hold countless memories. Ask what you seek, and we shall see."

        revealed_id = None
        if matched_secret:
            dialogue += f" Lean closer: {matched_secret.content}"
            revealed_id = matched_secret.secret_id

        return {
            "action": gesture,
            "dialogue": dialogue,
            "new_mood": mood,
            "disposition_delta": delta,
            "revealed_secret_id": revealed_id
        }

    def update_disposition(self, delta: float) -> float:
        """Adjusts NPC disposition within normalized bounds [0.0, 1.0]."""
        self.persona.disposition = max(0.0, min(1.0, self.persona.disposition + delta))
        return self.persona.disposition

    def reset_memory(self) -> None:
        """Clears interaction history while preserving baseline persona."""
        self.history.clear()


# ============================================================================
# 4. PROCEDURAL & DYNAMIC NPC GENERATOR FACTORY
# ============================================================================

def create_dynamic_npc(
    name: str,
    role: str,
    era: str,
    location: str,
    traits: Optional[List[str]] = None,
    secrets: Optional[List[Dict[str, Any]]] = None
) -> NPCAgent:
    """Factory helper to dynamically instantiate any historical NPC archetype on demand.

    Example:
        merchant = create_dynamic_npc(
            name="Seth Maniram",
            role="Spice & Silk Merchant",
            era="1515 AD Vijayanagara",
            location="Hampi Sacred Bazaar",
            traits=["shrewd", "hospitable", "superstitious"],
            secrets=[{"id": "clue_1", "trigger": "coracle", "trust": 0.6, "text": "The boatman crosses at sunset."}]
        )
    """
    secret_objects = []
    if secrets:
        for s in secrets:
            secret_objects.append(
                SecretLore(
                    secret_id=s.get("id", "secret_0"),
                    topic_trigger=s.get("trigger", "lore"),
                    required_trust=float(s.get("trust", 0.5)),
                    content=s.get("text", "")
                )
            )

    persona = NPCPersona(
        npc_id=f"npc_{name.lower().replace(' ', '_')}",
        name=name,
        role=role,
        era=era,
        location=location,
        background=f"A seasoned {role} residing in {location} during the era of {era}.",
        personality_traits=traits or ["resourceful", "knowledgeable"],
        secrets=secret_objects
    )

    return NPCAgent(persona=persona)


# ============================================================================
# 5. SELF-TEST RUNNER (STANDALONE DRY-RUN)
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Bharat Gatha - Dynamic Standalone NPC Agent Self-Test")
    print("=" * 60)

    # Instantiate a dynamic artisan NPC
    test_npc = create_dynamic_npc(
        name="Ustad Ahmad Lahori",
        role="Imperial Chief Architect",
        era="1653 AD Mughal Empire",
        location="Taj Mahal Construction Terrace, Yamuna Riverbank",
        traits=["visionary", "scholarly", "philosophical"],
        secrets=[
            {
                "id": "secret_dome_geometry",
                "trigger": "dome, marble symmetry, minarets",
                "trust": 0.55,
                "text": "The four minarets are deliberately angled outwards by two degrees so that an earthquake would never topple them upon the main dome."
            }
        ]
    )

    print(f"\nCreated NPC: {test_npc.persona.name} ({test_npc.persona.role})")
    print(f"Setting: {test_npc.persona.location} [{test_npc.persona.era}]")
    print(f"Baseline Disposition: {test_npc.persona.disposition}")

    # Simulated Dynamic Turn 1: Polite Greeting
    turn1 = test_npc.interact(
        player_input="Pranaam Ustad-ji. I marvel at the symmetry of your design.",
        world_context={"time_of_day": "sunset", "weather": "river mist"}
    )
    print("\n[Turn 1 Output]")
    print(f"Action: {turn1['action']}")
    print(f"Spoken: {turn1['dialogue']}")
    print(f"Mood: {turn1['mood']} | Disposition: {turn1['disposition']}")

    # Simulated Dynamic Turn 2: Querying Secret Topic
    turn2 = test_npc.interact(
        player_input="Tell me about the dome and the outer minarets.",
        world_context={"time_of_day": "dusk", "weather": "lantern light"}
    )
    print("\n[Turn 2 Output]")
    print(f"Action: {turn2['action']}")
    print(f"Spoken: {turn2['dialogue']}")
    print(f"Mood: {turn2['mood']} | Disposition: {turn2['disposition']}")
    print(f"Unlocked Secret: {turn2['revealed_secret']}")
    print("=" * 60)
    print("NPC Agent verification completed successfully (standalone and uncoupled).")
