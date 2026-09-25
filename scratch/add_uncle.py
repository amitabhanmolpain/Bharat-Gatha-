import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for Uncle
state_insertion = """  // Uncle Companion State
  const [showUncleDialogue, setShowUncleDialogue] = useState(false);
"""
content = content.replace('  // Jolly Bhai Companion State', state_insertion + '  // Jolly Bhai Companion State')

# 2. Reset state on scene change
content = content.replace('setShowJollyDialogue(false);', 'setShowJollyDialogue(false);\n    setShowUncleDialogue(false);')

# 3. Add proximity check
proximity_insertion = """  const unclePos = { x: 30.0, y: 75.0 };
  const distToUncle = Math.sqrt(
    Math.pow(playerPos.x - unclePos.x, 2) + Math.pow(playerPos.y - unclePos.y, 2)
  );
  const isNearUncle = scene === "anegundi_river_crossing" && distToUncle < 11.0;
"""
content = content.replace('  const coraclePos = { x: 65.0, y: 78.0 };', proximity_insertion + '\n  const coraclePos = { x: 65.0, y: 78.0 };')

# 4. Handle Interaction Key
interaction_logic = """        } else if (isNearUncle) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowUncleDialogue(true);
"""
content = content.replace('        } else if (isNearCoracle) {', interaction_logic + '        } else if (isNearCoracle) {')

# 5. Render the Uncle on the map
render_uncle = """
          {/* --- UNCLE COMPANION NPC --- */}
          {scene === "anegundi_river_crossing" && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-[100%] flex flex-col items-center z-10"
              style={{ left: `${unclePos.x}%`, top: `${unclePos.y}%` }}
            >
              {isNearUncle && (
                <div className="mb-2 bg-[#1a1714]/90 border-2 border-[#d4a359] text-[#f6ede0] px-3 py-1 rounded-lg text-xs font-serif shadow-[0_4px_15px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-1.5 whitespace-nowrap">
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-[#2b2520] border border-[#d4a359] text-[#d4a359] px-1 rounded text-[10px] font-mono font-bold shadow-[0_1px_0_1px_rgba(0,0,0,0.8)]">E</kbd>
                  <span>Talk to Friend</span>
                </div>
              )}
              <img
                src="/uncle_companion.png"
                alt="Uncle Companion"
                className="w-20 h-28 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)]"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          )}
"""
content = content.replace('{/* --- OPENING ATMOSPHERE FLOATING BANNERS --- */}', render_uncle + '\n          {/* --- OPENING ATMOSPHERE FLOATING BANNERS --- */}')

# 6. Render the Dialogue Panel
dialogue_panel = """
          {/* --- UNCLE DIALOGUE MODAL --- */}
          {showUncleDialogue && scene === "anegundi_river_crossing" && (
            <DialoguePanel
              sceneId="anegundi_river_crossing"
              currentSceneId={scene}
              characterName="Uncle Companion"
              characterTitle="Your Loyal Friend"
              dialogueText="I will travel with you through Vijayanagara! Speak to the sage and let's go."
              isSpeaking={false}
              showInput={false}
              onClose={() => setShowUncleDialogue(false)}
            />
          )}
"""
content = content.replace('{/* --- CORACLE FERRY INSPECTION MODAL (STAGE 1 LOCKED STATE) --- */}', dialogue_panel + '\n          {/* --- CORACLE FERRY INSPECTION MODAL (STAGE 1 LOCKED STATE) --- */}')

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Uncle successfully added!")
