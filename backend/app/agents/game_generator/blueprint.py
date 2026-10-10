"""
blueprint.py
Structured output container for a generated game.
"""
from __future__ import annotations

import json
import textwrap
from dataclasses import dataclass, field
from typing import Any


@dataclass
class GameBlueprint:
    """
    Immutable, serialisable record of a generated game.

    Attributes map directly to the generation pipeline stages:
      game_id, title, genre, era, setting, tone, mechanics
      -> opening_narration, quest, scenes, npcs, items, puzzles
      -> source_prompt  (original user input, preserved for traceability)
    """

    game_id:           str
    title:             str
    genre:             str
    era:               str
    setting:           str
    tone:              str
    mechanics:         list[str]
    opening_narration: str
    quest:             dict[str, Any]
    scenes:            list[dict[str, Any]]
    npcs:              list[dict[str, Any]]
    items:             list[dict[str, Any]]
    puzzles:           list[dict[str, Any]]
    source_prompt:     str

    # ------------------------------------------------------------------ #

    def to_dict(self) -> dict[str, Any]:
        """Serialise to a plain Python dict."""
        return {k: v for k, v in self.__dict__.items()}

    def to_json(self, indent: int = 2) -> str:
        """Serialise to a formatted JSON string."""
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    # ------------------------------------------------------------------ #

    def summary(self) -> str:
        """Human-readable terminal summary of the generated blueprint."""
        W = 66
        sep = "-" * W

        def row(label: str, value: str) -> str:
            return f"  {label:<14} {value}"[:W]

        scene_list  = " -> ".join(s["name"] for s in self.scenes)
        npc_list    = ",  ".join(f"{n['name']} [{n['role']}]" for n in self.npcs)
        item_list   = ",  ".join(i["name"] for i in self.items)
        puzzle_list = ",  ".join(p["type"] for p in self.puzzles)

        lines = [
            "",
            f"  +{'-' * (W - 2)}+",
            f"  |{'  GAME BLUEPRINT':^{W - 2}}|",
            f"  |{'  ' + self.title:^{W - 2}}|",
            f"  +{'-' * (W - 2)}+",
            sep,
            row("ID",        self.game_id),
            row("Genre",     self.genre.upper()),
            row("Era",       self.era.title()),
            row("Setting",   self.setting.title()),
            row("Tone",      self.tone.title()),
            row("Mechanics", " + ".join(self.mechanics)),
            sep,
            "  QUEST",
            f"    {self.quest.get('title', 'Main Quest')}",
            f"    -> {self.quest.get('objective', '')}",
            sep,
            row("Scenes",   scene_list),
            row("NPCs",     npc_list),
            row("Items",    item_list),
            row("Puzzles",  puzzle_list),
            sep,
            "  OPENING NARRATION",
            textwrap.indent(self.opening_narration, "  "),
            sep,
        ]
        return "\n".join(lines)

    # ------------------------------------------------------------------ #

    def __repr__(self) -> str:
        return f"<GameBlueprint id={self.game_id!r} title={self.title!r} genre={self.genre!r}>"
