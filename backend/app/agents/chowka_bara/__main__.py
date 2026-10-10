"""
Runner for ChowkaBaraAgent.
"""
import sys, os, json

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(_HERE))

try:
    from chowka_bara.agent import ChowkaBaraAgent
except ImportError:
    from agent import ChowkaBaraAgent


def main():
    agent = ChowkaBaraAgent()
    print("--- Chowka Bara Game Agent Demo ---")
    roll = agent.roll_cowries()
    print("Cowrie Roll:", roll)
    
    board_state = {
        "pawns_player_1": ["outer_02", "outer_05", "home", "home"],
        "pawns_player_2": ["outer_08", "safe_gatta_01", "home", "home"],
        "turn": "player_1"
    }
    move = agent.compute_best_move(board_state, roll["roll_value"])
    print("\nBest Move Recommendation:")
    print(json.dumps(move, indent=2, ensure_ascii=True))
    
    print("\nRule Query (What is a Gatta?):")
    rule = agent.ask_rule("What is a gatta safe cell?")
    print(rule.encode('ascii', errors='replace').decode('ascii'))


if __name__ == "__main__":
    main()
