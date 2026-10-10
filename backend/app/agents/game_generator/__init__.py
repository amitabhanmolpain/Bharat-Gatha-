"""
game_generator package
Prompt-driven game blueprint generation pipeline powered by LangChain.

Public API
----------
GameGeneratorAgent   generate(prompt) -> GameBlueprint
                     batch_generate(prompts) -> list[GameBlueprint]

GameBlueprint        to_dict() -> dict
                     to_json() -> str
                     summary() -> str

GameGeneratorChain   parse_intent / generate_narration / generate_quest
PromptParser         parse() -> dict
WorldGenerator       generate_title / scenes / npcs / items / puzzles / quest
NarrativeEngine      compose() -> str
"""

from .agent        import GameGeneratorAgent
from .blueprint    import GameBlueprint
from .chain        import GameGeneratorChain
from .parser       import PromptParser
from .world_builder import WorldGenerator, NarrativeEngine

__all__ = [
    "GameGeneratorAgent",
    "GameBlueprint",
    "GameGeneratorChain",
    "PromptParser",
    "WorldGenerator",
    "NarrativeEngine",
]

__version__ = "2.0.0"
