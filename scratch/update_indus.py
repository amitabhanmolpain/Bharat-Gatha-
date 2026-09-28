import os

file_path = r"c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\app\play\indus\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF for consistent replacement
c_normalized = content.replace("\r\n", "\n")

# 1. Update imports and ALLOW_INDUS_TTS
old_import = """import SteatiteSealPuzzle from "./components/SteatiteSealPuzzle";

// TTS is strictly disabled in Indus Valley per user instruction until explicit permission is given
const ALLOW_INDUS_TTS = false;"""

new_import = """import SteatiteSealPuzzle from "./components/SteatiteSealPuzzle";
import NarratorSubtitle from "../../../components/NarratorSubtitle";
import DialoguePanel from "../../components/DialoguePanel";

// TTS enabled in Indus Valley
const ALLOW_INDUS_TTS = true;"""

if old_import in c_normalized:
    c_normalized = c_normalized.replace(old_import, new_import, 1)
    print("Updated imports & ALLOW_INDUS_TTS")
else:
    print("Warning: old_import not found")

# 2. Add intro narration useEffect and Jolly state
old_state = """  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);"""

new_state = """  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);

  // Jolly Bhai Companion State
  const [showJollyDialogue, setShowJollyDialogue] = useState(false);
  const [jollySpeechText, setJollySpeechText] = useState("");
  const hasPlayedIndusIntroRef = useRef(false);

  // Auto-play intro narration on arrival
  useEffect(() => {
    if (!isLoading && !hasPlayedIndusIntroRef.current) {
      hasPlayedIndusIntroRef.current = true;
      const introText =
        "Time traveler, modern media often highlights the negatives to make India look backward. Your mission is to collect proof within this city to show the world exactly how advanced our ancestors were 5,000 years ago.";
      const timer = setTimeout(() => {
        void playNarration(introText, {
          speaker: "ratan",
          pace: 0.9,
          language_code: "en-IN",
        });
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);"""

if old_state in c_normalized:
    c_normalized = c_normalized.replace(old_state, new_state, 1)
    print("Updated intro narration & Jolly state")
else:
    print("Warning: old_state not found")

# 3. Add floating Genie next to Hero Player
old_hero = """          <img
            src="/player.png"
            alt="Hero Player"
            className="w-32 h-32 md:w-36 md:h-36 object-contain"
            style={{
              imageRendering: "pixelated",
              transform: `translateY(${walkBob}px) rotate(${walkSway}deg)`,
              transition: isWalking ? "none" : "transform 0.15s ease-out",
            }}
          />
        </div>
      </div>"""

new_hero = """          <img
            src="/player.png"
            alt="Hero Player"
            className="w-32 h-32 md:w-36 md:h-36 object-contain"
            style={{
              imageRendering: "pixelated",
              transform: `translateY(${walkBob}px) rotate(${walkSway}deg)`,
              transition: isWalking ? "none" : "transform 0.15s ease-out",
            }}
          />
        </div>

        {/* --- FLOATING GENIE COMPANION (JOLLY BHAI) --- */}
        {(() => {
          const genieX = facingLeft ? playerPos.x + 4.5 : playerPos.x - 4.5;
          const genieY = playerPos.y - 7.5;

          return (
            <div
              className="absolute z-20 pointer-events-auto cursor-pointer group transition-all duration-700 ease-out"
              onClick={() => {
                const jollySpeech =
                  "Hello time traveler! I am Jolly Bhai. Walk around this ancient planned city of Mohenjo-daro with me. Notice the baked brick drains, granaries, and precision stone weights!";
                setJollySpeechText(jollySpeech);
                setShowJollyDialogue(true);
                stopAllCharacterVoice();
                void playCharacterDialogue({ character: "jolly", text: jollySpeech });
              }}
              style={{
                left: `${genieX}%`,
                top: `${genieY}%`,
                transform: "translate(-50%, -50%)",
              }}
              title="🧞 Jolly Bhai (Genie Guide - Click for Story)"
            >
              <div className="relative animate-bounce" style={{ animationDuration: "3.5s" }}>
                <img
                  src="/genie_rajasthani_transparent.png"
                  alt="Jolly Bhai Genie"
                  className="w-24 h-24 md:w-28 md:h-28 object-contain transition-all group-hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                  style={{
                    imageRendering: "pixelated",
                    transform: facingLeft ? "scaleX(1)" : "scaleX(-1)",
                  }}
                />
              </div>
            </div>
          );
        })()}
      </div>"""

if old_hero in c_normalized:
    c_normalized = c_normalized.replace(old_hero, new_hero, 1)
    print("Updated floating Genie companion")
else:
    print("Warning: old_hero not found")

# 4. Add Jolly dialogue panel and NarratorSubtitle
old_end = """              <button
                onClick={() => {
                  soundFx.playKeyboardClick();
                  setShowRestartConfirmModal(false);
                }}
                className="flex-1 bg-white hover:bg-gray-100 text-black font-bold text-xs py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""

new_end = """              <button
                onClick={() => {
                  soundFx.playKeyboardClick();
                  setShowRestartConfirmModal(false);
                }}
                className="flex-1 bg-white hover:bg-gray-100 text-black font-bold text-xs py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- JOLLY BHAI DIALOGUE MODAL --- */}
      {showJollyDialogue && (
        <DialoguePanel 
          sceneId={scene}
          currentSceneId={scene}
          characterName="Jolly Bhai"
          characterTitle="Ancient Time-Traveling Genie Companion"
          characterId="jolly"
          historicalContext={{
            current_year: 2500,
            era: "Indus Valley Civilisation (Bronze Age)",
            location: "Mohenjo-daro / Harappa",
            nearby_monuments: "The Great Bath, Granary, Grid City Avenues, Priest-King Sanctuary",
            historical_events: "Planned urbanization, standardized weights, maritime trade"
          }}
          dialogueText={
            jollySpeechText || "Hello, friend! I am Jolly Bhai. Notice how advanced this 5,000-year-old city is!"
          }
          isSpeaking={true}
          showInput={true}
          options={[
            { id: 1, text: "How old is Mohenjo-daro?" },
            { id: 2, text: "How did the Great Bath drainage work?" },
            { id: 3, text: "Tell me about Indus seals and scripts." }
          ]}
          onOptionSelect={() => {
            if (typeof soundFx.playSelect === "function") soundFx.playSelect();
            stopAllCharacterVoice();
            setShowJollyDialogue(false);
          }}
          onClose={() => {
            stopAllCharacterVoice();
            setShowJollyDialogue(false);
          }}
        />
      )}

      {/* --- NARRATOR SUBTITLE OVERLAY --- */}
      <NarratorSubtitle />
    </div>
  );
}"""

if old_end in c_normalized:
    c_normalized = c_normalized.replace(old_end, new_end, 1)
    print("Updated Jolly dialogue panel and NarratorSubtitle")
else:
    print("Warning: old_end not found")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(c_normalized)

print("Indus Valley file written successfully!")
