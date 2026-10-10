"""
Runner for ChannapatnaToysMasterAgent.
"""
import json
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(_HERE))

try:
    from channapatna_toys.agent import ChannapatnaToysMasterAgent
except ImportError:
    from agent import ChannapatnaToysMasterAgent


def main():
    agent = ChannapatnaToysMasterAgent()
    print("--- Channapatna Toys Master Agent Demo ---")
    
    blueprint = agent.craft_toy_blueprint("Wooden Rocking Horse with Turmeric and Indigo dyes")
    print("Craft Blueprint:")
    print(json.dumps(blueprint, indent=2, ensure_ascii=True))
    
    print("\nHeritage Query:")
    heritage = agent.consult_craft_heritage("Why are Channapatna toys child-safe and eco-friendly?")
    print(heritage.encode('ascii', errors='replace').decode('ascii'))


if __name__ == "__main__":
    main()
