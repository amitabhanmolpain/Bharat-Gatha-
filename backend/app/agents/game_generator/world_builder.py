"""
world_builder.py
Builds a dynamic game world skeleton from parsed intent tokens using LangChain chains
and extensible data pools.
"""
from __future__ import annotations

import random
import uuid
from typing import Any

try:
    from .chain import GameGeneratorChain
except ImportError:
    from chain import GameGeneratorChain


# ─────────────────────────────────────────────────────────────────────────────
# Data Registries
# ─────────────────────────────────────────────────────────────────────────────

SCENE_POOL: dict[str, list[str]] = {
    "forest":  ["The Whispering Grove", "Elder Oak Ruins", "Moonlit Glade", "The Hollow Banyan", "The Thornveil Path"],
    "dungeon": ["The Obsidian Depths", "Catacombs of the Forgotten", "The Sunken Vault", "The Shattered Keep", "Chamber of Echoes"],
    "city":    ["The Grand Bazaar", "Royal Court Courtyard", "The Scholar's Quarter", "Night Market Alley", "The Lantern District"],
    "sea":     ["Storm Harbour Docks", "The Leviathan's Cove", "Saltmist Archipelago", "Depths of Varuna", "The Widow's Reef"],
    "desert":  ["The Scorched Expanse", "Oasis of Echoes", "The Dune Labyrinth", "Caravan Crossing", "The Mirage Gate"],
    "sky":     ["The Sky Citadel", "Cloudshroud Peak", "The Aerie of Legends", "Stormwing Plateau", "The Gale Spire"],
    "temple":  ["The Inner Sanctum", "The Pillared Hall", "The Oracle's Chamber", "The Sacred Pool", "The Veil of Flames"],
}

NPC_POOL: list[dict[str, str]] = [
    {"role": "Elder",       "trait": "wise but evasive",        "agenda": "protects a truth older than memory"},
    {"role": "Merchant",    "trait": "sharp-eyed and charming", "agenda": "will trade secrets for profit"},
    {"role": "Rebel",       "trait": "passionate, impulsive",   "agenda": "destabilise the ruling order"},
    {"role": "Scholar",     "trait": "meticulous, distracted",  "agenda": "recover a long-lost manuscript"},
    {"role": "Villain",     "trait": "calm and methodical",     "agenda": "consolidate absolute control"},
    {"role": "Child",       "trait": "curious but frightened",  "agenda": "witnessed something they cannot explain"},
    {"role": "Ghost",       "trait": "sorrowful, ethereal",     "agenda": "unfinished justice from a past life"},
    {"role": "Guard",       "trait": "loyal, quietly conflicted","agenda": "duty versus a growing moral doubt"},
    {"role": "Oracle",      "trait": "cryptic, deliberate",     "agenda": "nudge destiny without revealing it"},
    {"role": "Trickster",   "trait": "playful, dangerous",      "agenda": "test the hero's true character"},
    {"role": "Blacksmith",  "trait": "gruff, precise",          "agenda": "forge one last legendary weapon"},
    {"role": "Spy",         "trait": "charming double agent",   "agenda": "serve whichever side is winning"},
]

ITEM_POOL: list[dict[str, str]] = [
    {"name": "Moonstone Seal",         "type": "key",      "desc": "An ancient wax seal — certain doors yield to it alone."},
    {"name": "The Worn Map",           "type": "document", "desc": "Half-burned parchment revealing a path no one remembers."},
    {"name": "Iron Lantern",           "type": "tool",     "desc": "Its flame burns even in magically darkened rooms."},
    {"name": "Carved Bone Amulet",     "type": "relic",    "desc": "Hums faintly when pointed toward hidden passages."},
    {"name": "Poisoned Inkwell",       "type": "clue",     "desc": "Used to pen a forged letter that changed history."},
    {"name": "Obsidian Blade",         "type": "weapon",   "desc": "Etched with the names of those it has outlived."},
    {"name": "Silk Merchant's Ledger", "type": "document", "desc": "Columns of figures — and columns of favours owed."},
    {"name": "Crystal Shard",          "type": "relic",    "desc": "Fragment of a mirror that once showed the future."},
    {"name": "Copper Sun Disc",        "type": "artefact", "desc": "Projects star-charts when held under moonlight."},
    {"name": "Reed Cipher Scroll",     "type": "clue",     "desc": "Nested codes that name a person no one dares to name."},
    {"name": "Thunderwood Staff",      "type": "weapon",   "desc": "Channels storm energy through a living-wood core."},
    {"name": "Alchemist's Phial",      "type": "tool",     "desc": "Contents unknown — reaction depends on context."},
]

PUZZLE_POOL: list[dict[str, str]] = [
    {"type": "riddle",          "desc": "A carved inscription poses a riddle; the answer shifts a hidden counterweight.", "hint": "The answer is concealed within the question itself."},
    {"type": "symbol_sequence", "desc": "Rotating discs must align to reproduce the royal calendar's opening sequence.",   "hint": "The sequence begins at the winter solstice symbol."},
    {"type": "dialogue_choice", "desc": "A guardian spirit only steps aside for a visitor who speaks the old greeting.",   "hint": "The greeting is inscribed on the mural behind the pillar."},
    {"type": "item_combination","desc": "Two artefacts from the inventory, when pressed together, unseal the door.",        "hint": "One provides light; the other focuses it."},
    {"type": "shadow_map",      "desc": "A lantern must be angled so its shadow aligns with the engraved floor pattern.",   "hint": "The correct angle matches the position on the sundial."},
    {"type": "weight_balance",  "desc": "Stone tiles must be loaded with the correct weights to open the floor hatch.",     "hint": "The relief carvings show the correct distribution."},
    {"type": "sound_sequence",  "desc": "Bells in the chamber must be struck in a sequence matching the ancestor chant.",   "hint": "Listen to the wind — it carries the pattern."},
]

LORE_POOL: list[str] = [
    "Legends say this district thrived until a single night of silence consumed every voice within it.",
    "The old founders encoded their laws in copper plates — all seven have since been lost to time.",
    "A prophecy carved above the west gate reads: 'The stranger who owes nothing shall balance all debts.'",
    "Three factions share one secret — each believes the other two have forgotten it.",
    "The artefact was shattered deliberately; only together do the pieces reveal its true purpose.",
    "Every night at the third watch, the bells ring without hands — no one has ever discovered why.",
    "The last keeper of this archive died mid-sentence; her final word was sealed inside a locked reliquary.",
    "Maps of this region disagree on one road — the road that only appears in drought years.",
]

NAME_POOL: dict[str, list[str]] = {
    "ancient":      ["Arjuna", "Devaprakash", "Kali-Ma", "Manu", "Priya", "Suryadeva", "Veda", "Chandraki"],
    "medieval":     ["Govinda", "Ratan", "Rani Lila", "Shamsher", "Bhima", "Durga", "Veerendra", "Chandrika"],
    "mythological": ["Indra", "Saraswati", "Yama", "Kubera", "Nandi", "Agni", "Vayu", "Ashwini"],
    "modern":       ["Arun", "Meera", "Rahul", "Simran", "Vikram", "Nisha", "Aryan", "Kaveri"],
    "futuristic":   ["Nova-7", "Helix", "Kiran-X", "Synth", "Aria-9", "Zephyr", "Nexus", "Prism"],
}

TITLE_POOL: dict[str, dict[str, list[str]]] = {
    "prefix": {
        "any": ["Chronicles of", "The Last", "Shadow of", "Rise of",
                "Echoes of", "The Forgotten", "Curse of", "Reign of",
                "Ashes of", "The Reckoning of"],
    },
    "noun": {
        "adventure":  ["the Lost Throne", "the Wanderer's Path", "the Golden Road", "the Uncharted Shore"],
        "mystery":    ["the Hidden Seal", "the Vanished Queen", "the Cipher Tower", "the Silent Witness"],
        "horror":     ["the Pale King", "the Eternal Dusk", "the Hollow", "the Shrieking Gate"],
        "rpg":        ["the Dragon's Pact", "the Broken Staff", "the Seven Seals", "the Fractured Crown"],
        "strategy":   ["the Iron Crescent", "the Siege of Dawn", "the Divided Kingdom", "the War Council"],
        "puzzle":     ["the Mirrored Labyrinth", "the Codex Vault", "the Shattered Key", "the Echoing Lock"],
        "platformer": ["the Sky Runner", "the Neon Leap", "the Crystal Falls", "the Final Platform"],
        "simulation": ["the Sovereign Realm", "the Guild Master", "the Iron Colony", "the Silk Road"],
    },
}

NARRATION_OPENINGS: dict[str, str] = {
    "epic":        "A grand tapestry unfolds, woven with threads of fate, duty, and sacrifice.",
    "dark":        "Mist rolls thick across forgotten stones; shadows whisper secrets best left unheard.",
    "comedic":     "Nothing ever goes according to plan — least of all when history gets involved.",
    "educational": "Step across the threshold of time to uncover truths preserved in stone and song.",
    "romantic":    "Two paths cross beneath a twilight sky, bound by a vow that time cannot erode.",
}


# ─────────────────────────────────────────────────────────────────────────────
# WorldGenerator
# ─────────────────────────────────────────────────────────────────────────────

class WorldGenerator:
    """Generates procedural world assets guided by parsed intent & LangChain chains."""

    def __init__(self, intent: dict, seed: int | None = None) -> None:
        self.intent = intent
        self._rng   = random.Random(seed)
        self.chain  = GameGeneratorChain()

    def _choice(self, lst: list[Any]) -> Any:
        return self._rng.choice(lst)

    def _sample(self, lst: list[Any], k: int) -> list[Any]:
        return self._rng.sample(lst, min(k, len(lst)))

    def generate_title(self) -> str:
        prefix = self._choice(TITLE_POOL["prefix"]["any"])
        genre  = self.intent.get("genre", "adventure")
        nouns  = TITLE_POOL["noun"].get(genre, TITLE_POOL["noun"]["adventure"])
        noun   = self._choice(nouns)
        return f"{prefix} {noun}"

    def generate_scenes(self, count: int = 4) -> list[dict]:
        setting    = self.intent.get("setting", "city")
        names_pool = SCENE_POOL.get(setting, SCENE_POOL["city"])
        selected   = self._sample(names_pool, count)
        scenes     = []

        for idx, name in enumerate(selected):
            scenes.append({
                "scene_id":    f"scene_{idx + 1:02d}",
                "name":        name,
                "setting_type": setting,
                "lore":        self._choice(LORE_POOL),
                "is_starting": idx == 0,
                "is_exit":     idx == (len(selected) - 1),
            })
        return scenes

    def generate_npcs(self, count: int = 3) -> list[dict]:
        era        = self.intent.get("era", "medieval")
        name_list  = NAME_POOL.get(era, NAME_POOL["medieval"])
        names      = self._sample(name_list, count)
        archetypes = self._sample(NPC_POOL, count)

        npcs = []
        for i, (name, arch) in enumerate(zip(names, archetypes)):
            npcs.append({
                "npc_id":       f"npc_{uuid.uuid4().hex[:8]}",
                "name":         name,
                "role":         arch["role"],
                "trait":        arch["trait"],
                "agenda":       arch["agenda"],
                "scene_ref":    f"scene_{(i % 4) + 1:02d}",
                "opening_line": (
                    f"{name} regards you with a gaze that is {arch['trait']}. "
                    f"Something in their manner suggests they intend to {arch['agenda']}."
                ),
            })
        return npcs

    def generate_items(self, count: int = 4) -> list[dict]:
        selected = self._sample(ITEM_POOL, count)
        items = []
        for item in selected:
            items.append({
                "item_id":     f"item_{uuid.uuid4().hex[:8]}",
                "name":        item["name"],
                "type":        item["type"],
                "description": item["desc"],
                "found_in":    f"scene_{self._rng.randint(1, 4):02d}",
                "is_critical": item["type"] in {"key", "clue", "document"},
            })
        return items

    def generate_puzzles(self, count: int = 2) -> list[dict]:
        selected = self._sample(PUZZLE_POOL, count)
        puzzles = []
        for idx, p in enumerate(selected):
            puzzles.append({
                "puzzle_id":   f"puzzle_{idx + 1:02d}",
                "type":        p["type"],
                "description": p["desc"],
                "hint":        p["hint"],
                "scene_ref":   f"scene_{idx + 1:02d}",
                "reward":      "Advance to the next area",
            })
        return puzzles

    def generate_quest(self) -> dict:
        title = self.generate_title()
        setting = self.intent.get("setting", "city")
        era = self.intent.get("era", "medieval")
        
        # Invoke LangChain LCEL quest chain
        quest_data = self.chain.generate_quest(title, setting, era)
        
        return {
            "title":            quest_data.get("main_goal", f"The Quest of {title}"),
            "objective":        quest_data.get("primary_target", f"Traverse the {setting} in search of truth."),
            "protagonist_role": self.intent.get("protagonist", "hero"),
            "stakes":           (
                f"The fate of the {era} world hangs in the balance. "
                f"Every decision shapes what remains."
            ),
            "victory_condition": quest_data.get("victory_condition", "Complete all primary objectives"),
            "failure_condition": quest_data.get("failure_condition", "Exceed maximum turns or lose all health"),
            "chapters":         ["Chapter 1: The Arrival", "Chapter 2: The Trial", "Chapter 3: The Climax"],
        }


# ─────────────────────────────────────────────────────────────────────────────
# NarrativeEngine
# ─────────────────────────────────────────────────────────────────────────────

class NarrativeEngine:
    """Composes dynamic opening narration from intent using LangChain chains."""

    def __init__(self, intent: dict, title: str) -> None:
        self.intent = intent
        self.title  = title
        self.chain  = GameGeneratorChain()

    def compose(self) -> str:
        narration = self.chain.generate_narration(
            title=self.title,
            genre=self.intent.get("genre", "adventure"),
            era=self.intent.get("era", "medieval"),
            setting=self.intent.get("setting", "city"),
            tone=self.intent.get("tone", "epic"),
        )
        return narration
