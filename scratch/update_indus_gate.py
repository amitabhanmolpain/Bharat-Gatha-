import os

file_path = r"c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\app\play\indus\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

c_normalized = content.replace("\r\n", "\n")

# 1. Update Trade Seal click handler to ensure both hasCollectedSeal and hasUnicornSeal are set
old_seal = """            onClick={() => {
              soundFx.playItemUnlock();
              setShowSealUnlockModal(true);
              setHasCollectedSeal(true);
            }}"""

new_seal = """            onClick={() => {
              soundFx.playItemUnlock();
              setShowSealUnlockModal(true);
              setHasCollectedSeal(true);
              setHasUnicornSeal(true);
            }}"""

if old_seal in c_normalized:
    c_normalized = c_normalized.replace(old_seal, new_seal, 1)
    print("Updated Trade Seal collection handler")
else:
    print("Warning: old_seal not found")

# 2. Update isNearGranaryExit proximity check to rely on Trade Seal collection
old_exit = """  const isNearGranaryExit =
    scene === "lower_town_gate" &&
    hasFirstRelicChertWeight &&
    playerPos.x >= 67.0 &&
    playerPos.x <= 76.0 &&
    playerPos.y >= 32.0 &&
    playerPos.y <= 38.0;"""

new_exit = """  const isNearGranaryExit =
    scene === "lower_town_gate" &&
    (hasCollectedSeal || hasUnicornSeal) &&
    playerPos.x >= 64.0 &&
    playerPos.x <= 78.0 &&
    playerPos.y >= 28.0 &&
    playerPos.y <= 44.0;"""

if old_exit in c_normalized:
    c_normalized = c_normalized.replace(old_exit, new_exit, 1)
    print("Updated isNearGranaryExit proximity condition")
else:
    print("Warning: old_exit not found")

# 3. Update Gate JSX trigger
old_gate_jsx = """        {/* Stage 1: Mohenjo-daro City Gateway Trigger to Residential Grid */}
        {scene === "lower_town_gate" && hasFirstRelicChertWeight && isNearGranaryExit && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: "71.5%", top: "31%" }}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
                <span>Enter City Gate to Residential Grid</span>
            </div>
          </div>
        )}"""

new_gate_jsx = """        {/* Stage 1: Mohenjo-daro City Gateway Trigger to Residential Grid */}
        {scene === "lower_town_gate" && isNearGranaryExit && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-10"
            style={{ left: "71.5%", top: "31%" }}
            onClick={() => triggerTransition("residential_grid", { x: 80.0, y: 38.0 })}
          >
            <div className="bg-[#fffdf5] border-[1.5px] border-black text-black px-2 py-1 rounded text-[11px] font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-2 whitespace-nowrap hover:scale-105 transition-transform">
              <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded px-1.5 py-0.5 text-[9px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">E</div>
              <span>Enter City Gate to Residential Grid</span>
            </div>
          </div>
        )}"""

if old_gate_jsx in c_normalized:
    c_normalized = c_normalized.replace(old_gate_jsx, new_gate_jsx, 1)
    print("Updated Gate JSX trigger and prompt")
else:
    print("Warning: old_gate_jsx not found")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(c_normalized)

print("Indus Valley Gate logic updated successfully!")
