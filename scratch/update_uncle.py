import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Uncle position
content = content.replace('const unclePos = { x: 30.0, y: 75.0 };', 'const unclePos = { x: 45.0, y: 58.0 };')

# Update Uncle rendering
old_uncle_render = """              <img
                src="/uncle_companion.png"
                alt="Uncle Companion"
                className="w-20 h-28 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)]"
                style={{ imageRendering: "pixelated" }}
              />"""
new_uncle_render = """              <img
                src="/uncle_companion.png"
                alt="Uncle Companion"
                className="w-24 h-32 object-contain object-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)]"
                style={{ imageRendering: "pixelated" }}
              />"""
content = content.replace(old_uncle_render, new_uncle_render)

# Update Uncle state for dynamic dialogue
state_insertion = """  const [uncleSpeechText, setUncleSpeechText] = useState("");
  const [uncleOptions, setUncleOptions] = useState<Array<{ id: number; text: string }>>([]);
"""
content = content.replace('const [showUncleDialogue, setShowUncleDialogue] = useState(false);', 'const [showUncleDialogue, setShowUncleDialogue] = useState(false);\n' + state_insertion)

# Update Interaction logic
old_interaction = """        } else if (isNearUncle) {
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowUncleDialogue(true);"""
new_interaction = """        } else if (isNearUncle) {
          setUncleSpeechText("Greetings! I am the local historian. I can tell you all about the glorious Vijayanagara Empire.");
          setUncleOptions([
            { id: 1, text: "What is this place?" },
            { id: 2, text: "Tell me about the founders." }
          ]);
          if (typeof soundFx.playDialogueOpen === "function") soundFx.playDialogueOpen();
          setShowUncleDialogue(true);"""
content = content.replace(old_interaction, new_interaction)

# Update Dialogue Panel
old_dialogue = """          {/* --- UNCLE DIALOGUE MODAL --- */}
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
          )}"""
new_dialogue = """          {/* --- UNCLE DIALOGUE MODAL --- */}
          {showUncleDialogue && scene === "anegundi_river_crossing" && (
            <DialoguePanel
              sceneId="anegundi_river_crossing"
              currentSceneId={scene}
              characterName="Historian"
              characterTitle="Your Loyal Friend"
              characterId="uncle"
              dialogueText={uncleSpeechText || "Greetings! I am the local historian."}
              isSpeaking={true}
              showInput={true}
              options={uncleOptions.length > 0 ? uncleOptions : [{ id: 1, text: "Tell me more." }]}
              onOptionSelect={(opt) => {
                // Let AI Handle It
              }}
              onClose={() => setShowUncleDialogue(false)}
            />
          )}"""
content = content.replace(old_dialogue, new_dialogue)

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Uncle rendering and TTS updated")
