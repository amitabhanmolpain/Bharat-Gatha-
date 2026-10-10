"""
parser.py
Extracts structured intent tokens from a raw natural language prompt
using a combination of keyword-analysis registries and LangChain LCEL chains.
"""
from __future__ import annotations
import re

try:
    from .chain import GameGeneratorChain
except ImportError:
    from chain import GameGeneratorChain


KEYWORD_REGISTRY: dict[str, dict[str, list[str]]] = {
    "genre": {
        "adventure":  ["adventure", "quest", "journey", "explore", "travel", "expedition", "map"],
        "mystery":    ["mystery", "detective", "clue", "solve", "hidden", "secret", "kidnap", "suspect", "investigation"],
        "horror":     ["horror", "ghost", "fear", "haunt", "demon", "curse", "monster", "undead", "possessed"],
        "rpg":        ["rpg", "role", "level", "xp", "class", "skill", "dragon", "magic", "spell", "mage", "wizard"],
        "strategy":   ["strategy", "war", "army", "siege", "empire", "battle", "resource", "build", "command", "conquer"],
        "puzzle":     ["puzzle", "riddle", "logic", "cipher", "lock", "code", "decode", "trick", "maze"],
        "platformer": ["platform", "jump", "run", "coins", "obstacle", "sprint", "leap", "dash"],
        "simulation": ["simulate", "manage", "city", "farm", "trade", "economy", "colony", "builder"],
    },
    "era": {
        "ancient":      ["ancient", "indus", "egypt", "roman", "greek", "harappa", "bronze", "vedic", "mesopotamia"],
        "medieval":     ["medieval", "knight", "castle", "king", "sultan", "empire", "samurai", "rajput", "feudal"],
        "mythological": ["myth", "god", "goddess", "divine", "avatar", "deity", "ramayana", "mahabharata", "olympus"],
        "modern":       ["modern", "urban", "21st", "contemporary", "present", "industrial", "colonial"],
        "futuristic":   ["future", "sci-fi", "space", "robot", "cyber", "galaxy", "neon", "android", "ai"],
    },
    "setting": {
        "forest":  ["forest", "jungle", "wood", "tree", "wild", "nature", "grove", "canopy"],
        "dungeon": ["dungeon", "cave", "underground", "mine", "catacomb", "ruin", "crypt", "vault"],
        "city":    ["city", "town", "market", "street", "palace", "court", "bazaar", "capital"],
        "sea":     ["sea", "ocean", "ship", "island", "port", "coast", "pirate", "navy", "fleet"],
        "desert":  ["desert", "sand", "oasis", "caravan", "dune", "sun", "tribe", "scorched"],
        "sky":     ["sky", "cloud", "mountain", "peak", "eagle", "storm", "aerie", "flying"],
        "temple":  ["temple", "shrine", "holy", "sacred", "ritual", "altar", "prayer", "sanctum"],
    },
    "protagonist": {
        "warrior":   ["warrior", "soldier", "fighter", "knight", "samurai", "guard", "raja", "commander"],
        "detective": ["detective", "spy", "investigator", "sleuth", "agent", "inspector", "analyst"],
        "scholar":   ["scholar", "sage", "historian", "scribe", "monk", "pundit", "teacher", "archivist"],
        "spirit":    ["spirit", "ghost", "avatar", "deity", "soul", "ancestor", "apparition"],
        "hero":      ["hero", "champion", "chosen", "savior", "young", "ordinary", "wanderer"],
    },
    "tone": {
        "epic":        ["epic", "grand", "vast", "legendary", "glorious", "heroic", "monumental"],
        "dark":        ["dark", "grim", "tragic", "brutal", "corrupt", "fallen", "bleak", "gritty"],
        "comedic":     ["funny", "comedy", "humor", "silly", "lighthearted", "quirky", "whimsical"],
        "educational": ["learn", "history", "education", "fact", "culture", "heritage", "knowledge"],
        "romantic":    ["love", "romance", "emotion", "heart", "bond", "devotion", "passion"],
    },
    "mechanics": {
        "exploration": ["explore", "discover", "map", "path", "navigate", "traverse", "unlock", "roam"],
        "combat":      ["fight", "battle", "attack", "defeat", "enemy", "boss", "weapon", "duel"],
        "dialogue":    ["talk", "converse", "choice", "dialogue", "question", "persuade", "negotiate"],
        "stealth":     ["sneak", "hide", "shadow", "spy", "invisible", "evade", "ambush", "infiltrate"],
        "crafting":    ["craft", "forge", "create", "combine", "brew", "build", "smith", "inscribe"],
        "puzzle":      ["puzzle", "riddle", "cipher", "deduce", "decode", "clue", "logic"],
    },
}


class PromptParser:
    """
    Converts a plain-text user prompt into a structured intent dictionary
    by scoring keyword matches across registered dimensions and invoking
    LangChain LCEL intent extraction chains.
    """

    def __init__(self, prompt: str) -> None:
        self.raw   = prompt
        self._text = re.sub(r"[^a-z0-9 ]", " ", prompt.lower())
        self.chain = GameGeneratorChain()

    # ------------------------------------------------------------------ #

    def _score(self, dimension: str) -> dict[str, int]:
        return {
            cat: sum(1 for kw in kws if kw in self._text)
            for cat, kws in KEYWORD_REGISTRY[dimension].items()
        }

    def _best(self, dimension: str, default: str) -> str:
        scores = {k: v for k, v in self._score(dimension).items() if v > 0}
        return max(scores, key=scores.__getitem__) if scores else default

    def _top_n(self, dimension: str, n: int = 2) -> list[str]:
        scores = {k: v for k, v in self._score(dimension).items() if v > 0}
        ranked = sorted(scores, key=scores.__getitem__, reverse=True)
        return ranked[:n] if ranked else [next(iter(KEYWORD_REGISTRY[dimension]))]

    # ------------------------------------------------------------------ #

    def parse(self) -> dict:
        """Return a fully resolved intent dict using LangChain + keyword fallback."""
        llm_intent = self.chain.parse_intent(self.raw)
        
        return {
            "raw_prompt":  self.raw,
            "genre":       llm_intent.get("genre") or self._best("genre", "adventure"),
            "era":         llm_intent.get("era") or self._best("era", "medieval"),
            "setting":     llm_intent.get("setting") or self._best("setting", "city"),
            "protagonist": llm_intent.get("protagonist") or self._best("protagonist", "hero"),
            "tone":        llm_intent.get("tone") or self._best("tone", "epic"),
            "mechanics":   llm_intent.get("mechanics") or self._top_n("mechanics"),
        }

    def __repr__(self) -> str:
        return f"PromptParser({self.raw!r})"
