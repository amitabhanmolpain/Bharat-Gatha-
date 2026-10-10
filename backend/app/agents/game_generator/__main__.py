"""
Entry-point for the game_generator package demo runner.

Run from the project root:
    python backend/app/agents/game_generator/__main__.py
"""
import sys, os, json

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(_HERE))   # agents/ on path

try:
    from game_generator.agent import GameGeneratorAgent
except ImportError:
    from agent import GameGeneratorAgent

DEMO_PROMPTS = [
    "A dark mystery set in a medieval Indian city - a scholar unravels a temple kidnapping conspiracy",
    "An epic adventure through ancient Indus Valley ruins driven by puzzle-solving and exploration",
    "A grand strategy game commanding Vijayanagara Empire forces at the Battle of Talikota",
    "A horror RPG where a spirit navigates the haunted catacombs of a fallen dynasty",
]


def run_demo() -> None:
    agent = GameGeneratorAgent(verbose=True, scene_count=4, npc_count=3)

    for i, prompt in enumerate(DEMO_PROMPTS, 1):
        divider = "=" * 72
        print(f"\n{divider}")
        print(f"  [{i}/{len(DEMO_PROMPTS)}]  {prompt}")
        print(divider)

        bp = agent.generate(prompt)
        print(bp.summary().encode('ascii', errors='replace').decode('ascii'))

        print("\n  -- JSON snapshot (quest + scene_01 + npc_01) --")
        d = bp.to_dict()
        snapshot = {
            "game_id":  d["game_id"],
            "title":    d["title"],
            "genre":    d["genre"],
            "era":      d["era"],
            "quest":    d["quest"],
            "scene_01": d["scenes"][0] if d["scenes"] else None,
            "npc_01":   d["npcs"][0]   if d["npcs"]   else None,
        }
        print(json.dumps(snapshot, indent=2, ensure_ascii=True))
        print()


if __name__ == "__main__":
    run_demo()
