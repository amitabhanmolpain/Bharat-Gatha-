"""
agent.py
Top-level orchestrator for the game-generation pipeline.
"""
from __future__ import annotations

import uuid

try:
    from .parser        import PromptParser
    from .world_builder import WorldGenerator, NarrativeEngine
    from .blueprint     import GameBlueprint
except ImportError:
    from parser        import PromptParser
    from world_builder import WorldGenerator, NarrativeEngine
    from blueprint     import GameBlueprint


class GameGeneratorAgent:
    """
    Converts a single natural-language prompt into a fully structured
    GameBlueprint by orchestrating the pipeline stages:

        PromptParser -> WorldGenerator -> NarrativeEngine -> GameBlueprint
    """

    VERSION = "2.0.0"

    def __init__(
        self,
        verbose:      bool = False,
        scene_count:  int  = 4,
        npc_count:    int  = 3,
        item_count:   int  = 4,
        puzzle_count: int  = 2,
    ) -> None:
        self.verbose      = verbose
        self.scene_count  = scene_count
        self.npc_count    = npc_count
        self.item_count   = item_count
        self.puzzle_count = puzzle_count

    # ------------------------------------------------------------------ #

    def _emit(self, stage: str, detail: str) -> None:
        if self.verbose:
            clean_detail = detail.encode('ascii', errors='replace').decode('ascii')
            print(f"  [{self.VERSION}][{stage}] {clean_detail}")

    # ------------------------------------------------------------------ #

    def generate(self, prompt: str) -> GameBlueprint:
        """
        Run the full generation pipeline for a single prompt.
        """
        prompt = (prompt or "").strip()
        if not prompt:
            raise ValueError("prompt must be a non-empty string.")

        # Stage 1: Intent extraction
        self._emit("PARSE", f"prompt={prompt!r}")
        intent = PromptParser(prompt).parse()
        self._emit("PARSE", (
            f"genre={intent['genre']}  era={intent['era']}  "
            f"setting={intent['setting']}  tone={intent['tone']}  "
            f"mechanics={intent['mechanics']}"
        ))

        # Stage 2: World construction
        self._emit("BUILD", "constructing world skeleton...")
        world   = WorldGenerator(intent)
        title   = world.generate_title()
        scenes  = world.generate_scenes(self.scene_count)
        npcs    = world.generate_npcs(self.npc_count)
        items   = world.generate_items(self.item_count)
        puzzles = world.generate_puzzles(self.puzzle_count)
        quest   = world.generate_quest()
        self._emit("BUILD", f"title={title!r}  scenes={len(scenes)}  npcs={len(npcs)}")

        # Stage 3: Narrative composition
        self._emit("NARRATE", "composing opening narration...")
        narration = NarrativeEngine(intent, title).compose()

        # Stage 4: Blueprint assembly
        game_id = f"game_{uuid.uuid4().hex[:12]}"
        self._emit("ASSEMBLE", f"id={game_id}")

        return GameBlueprint(
            game_id=game_id,
            title=title,
            genre=intent["genre"],
            era=intent["era"],
            setting=intent["setting"],
            tone=intent["tone"],
            mechanics=intent["mechanics"],
            opening_narration=narration,
            quest=quest,
            scenes=scenes,
            npcs=npcs,
            items=items,
            puzzles=puzzles,
            source_prompt=prompt,
        )

    # ------------------------------------------------------------------ #

    def batch_generate(self, prompts: list[str]) -> list[GameBlueprint]:
        if not prompts:
            raise ValueError("prompts list must contain at least one entry.")
        return [self.generate(p) for p in prompts]

    # ------------------------------------------------------------------ #

    def __repr__(self) -> str:
        return (
            f"<GameGeneratorAgent v{self.VERSION} "
            f"scenes={self.scene_count} npcs={self.npc_count} "
            f"items={self.item_count} puzzles={self.puzzle_count}>"
        )
