import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix bounds issue blocking the Uncle
old_bounds = """        // Outer bounding box
        if (
          targetX < config.minX ||
          targetX > config.maxX ||
          targetY < config.minY ||
          targetY > config.maxY
        ) {
          return false;
        }

        // Stage 1 Physics
        if (activeScene === "anegundi_river_crossing") {
          if (targetX > 54.0 && targetY < 65.0) return false;
          if (targetX < 24.0 && targetY > 78.0) return false;
        }"""
new_bounds = """        // Outer bounding box
        if (
          targetX < config.minX ||
          targetX > config.maxX ||
          targetY < config.minY ||
          targetY > config.maxY
        ) {
          return false;
        }

        // Stage 1 Physics
        if (activeScene === "anegundi_river_crossing") {
          if (targetX > 54.0 && targetY < 65.0) return false;
          // Removed bottom-left block so player can reach the historian
        }"""
content = content.replace(old_bounds, new_bounds)

# Add 3 animated boats to the water area
boats_jsx = """
          {/* --- ANIMATED BOATS IN WATER --- */}
          {scene === "anegundi_river_crossing" && (
            <>
              {/* Boat 1 (Top right) */}
              <div 
                className="absolute z-0"
                style={{
                  left: "75%",
                  top: "60%",
                  animation: "bob 3s ease-in-out infinite"
                }}
              >
                <img 
                  src="/sprite-egyptian-boat-1.png" 
                  alt="Boat 1" 
                  className="w-16 h-auto opacity-80"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Boat 2 (Middle right) */}
              <div 
                className="absolute z-0"
                style={{
                  left: "82%",
                  top: "65%",
                  animation: "bob 4s ease-in-out infinite 1s"
                }}
              >
                <img 
                  src="/sprite-egyptian-boat-2.png" 
                  alt="Boat 2" 
                  className="w-20 h-auto opacity-75"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Boat 3 (Bottom right) */}
              <div 
                className="absolute z-0"
                style={{
                  left: "70%",
                  top: "75%",
                  animation: "bob 3.5s ease-in-out infinite 0.5s"
                }}
              >
                <img 
                  src="/sprite-egyptian-boat-1.png" 
                  alt="Boat 3" 
                  className="w-24 h-auto opacity-90"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            </>
          )}
"""
content = content.replace('{/* --- UNCLE COMPANION NPC --- */}', boats_jsx + '\n          {/* --- UNCLE COMPANION NPC --- */}')

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Bounds fixed and boats added")
