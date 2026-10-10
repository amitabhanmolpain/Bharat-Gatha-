"""
Runner for VijayanagaraGuardAgent.
"""
import sys, os, json

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(_HERE))

try:
    from vijayanagara_guard.agent import VijayanagaraGuardAgent
except ImportError:
    from agent import VijayanagaraGuardAgent


def main():
    agent = VijayanagaraGuardAgent()
    print("--- Vijayanagara Guard Agent Demo ---")
    
    statement = "I am a foreign scholar presenting an imperial copper seal from King Krishnadevaraya."
    print("Visitor Statement:", statement)
    res = agent.challenge(statement)
    print("Guard Challenge:")
    print(res.encode('ascii', errors='replace').decode('ascii'))
    
    print("\nGate Inspection:")
    insp = agent.inspect("Imperial copper seal with royal elephant emblem")
    print(json.dumps(insp, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
