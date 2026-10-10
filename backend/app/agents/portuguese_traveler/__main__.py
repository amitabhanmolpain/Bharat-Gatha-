"""
Runner for PortugueseTravelerAgent.
"""
import sys, os, json

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(_HERE))

try:
    from portuguese_traveler.agent import PortugueseTravelerAgent
except ImportError:
    from agent import PortugueseTravelerAgent


def main():
    agent = PortugueseTravelerAgent()
    print("--- Portuguese Traveler Agent Demo ---")
    query = "Describe the grand bazaar of Hampi and the royal elephants."
    print("Query:", query)
    res = agent.observe(query)
    print("Response:")
    print(res.encode('ascii', errors='replace').decode('ascii'))
    print("\nReport:")
    rep = agent.generate_report("Bazaar Trade and Fortifications")
    print(json.dumps(rep, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
