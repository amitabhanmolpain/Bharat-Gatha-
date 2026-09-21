import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace('isStage4Complete,', 'isStage4Complete,\n  setHasRecruitedHistorian,')
content = content.replace('const isCampaignComplete = useAppSelector(state => state.progression.isCampaignComplete);', 'const isCampaignComplete = useAppSelector(state => state.progression.isCampaignComplete);\n  const hasRecruitedHistorian = useAppSelector(state => state.progression.hasRecruitedHistorian);')

# 2. Uncle position & proximity
content = content.replace('const unclePos = { x: 45.0, y: 58.0 };', 'const unclePos = { x: 18.0, y: 78.0 };')
content = content.replace('const isNearUncle = scene === "anegundi_river_crossing" && distToUncle < 11.0;', 'const isNearUncle = scene === "anegundi_river_crossing" && distToUncle < 11.0 && !hasRecruitedHistorian;')

# 3. Uncle interaction logic
old_interaction = """        } else if (isNearUncle) {
          setUncleSpeechText("Greetings! I am the local historian. I can tell you all about the glorious Vijayanagara Empire.");
          setUncleOptions([
            { id: 1, text: "What is this place?" },
            { id: 2, text: "Tell me about the founders." }
          ]);
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowUncleDialogue(true);"""
new_interaction = """        } else if (isNearUncle) {
          setUncleSpeechText("Greetings, traveler. I am also a historian, seeking to understand the tragic fall of such a magnificent empire.");
          setUncleOptions([
            { id: 1, text: "Let us seek the truth together." }
          ]);
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowUncleDialogue(true);"""
content = content.replace(old_interaction, new_interaction)

# 4. Dialogue Panel
old_dialogue = """              options={uncleOptions.length > 0 ? uncleOptions : [{ id: 1, text: "Tell me more." }]}
              onOptionSelect={(opt) => {
                // Let AI Handle It
              }}
              onClose={() => setShowUncleDialogue(false)}"""
new_dialogue = """              options={uncleOptions.length > 0 ? uncleOptions : [{ id: 1, text: "Tell me more." }]}
              onOptionSelect={(opt) => {
                if (opt.id === 1) {
                  dispatch(setHasRecruitedHistorian(true));
                  setShowUncleDialogue(false);
                }
              }}
              onClose={() => setShowUncleDialogue(false)}"""
content = content.replace(old_dialogue, new_dialogue)

# 5. Hide stationary uncle if recruited
old_render = """          {/* --- UNCLE COMPANION NPC --- */}
          {scene === "anegundi_river_crossing" && ("""
new_render = """          {/* --- UNCLE COMPANION NPC --- */}
          {scene === "anegundi_river_crossing" && !hasRecruitedHistorian && ("""
content = content.replace(old_render, new_render)

# 6. Global Uncle Follower
# Add it right after Jolly Bhai
global_uncle_render = """
        {/* --- UNCLE COMPANION FOLLOWER --- */}
        {hasRecruitedHistorian && (() => {
          const uncleFollowX = facingLeft ? playerPos.x - 12 : playerPos.x + 12;
          const uncleFollowY = playerPos.y;
          
          return (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-[100%] flex flex-col items-center pointer-events-auto group z-20"
              style={{
                left: `${uncleFollowX}%`,
                top: `${uncleFollowY}%`,
                transition: "left 0.8s ease-out, top 0.8s ease-out"
              }}
            >
              <img
                src="/uncle_companion.png"
                alt="Historian Companion"
                className="w-24 h-32 object-contain object-bottom transition-all drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                style={{
                  transform: `scaleX(${facingLeft ? -1 : 1})`,
                  imageRendering: "pixelated"
                }}
              />
            </div>
          );
        })()}
"""
content = content.replace('{/* --- OPENING ATMOSPHERE FLOATING BANNERS --- */}', global_uncle_render + '\n          {/* --- OPENING ATMOSPHERE FLOATING BANNERS --- */}')

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Uncle recruitment logic added!")
