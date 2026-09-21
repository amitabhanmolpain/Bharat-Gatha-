import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the targetX > 54 constraint
old_river_bounds = """        // Stage 1 Physics
        if (activeScene === "anegundi_river_crossing") {
          if (targetX > 54.0 && targetY < 65.0) return false;
          // Removed bottom-left block so player can reach the historian
        }"""
new_river_bounds = """        // Stage 1 Physics
        if (activeScene === "anegundi_river_crossing") {
          // Allow player to move all along
        }"""
content = content.replace(old_river_bounds, new_river_bounds)

# Fix the broken image source if the user used /coracle_animated.png
content = content.replace('src="/coracle_animated.png"', 'src="/sprite-egyptian-boat-1.png"')

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Movement constraint removed and image fixed")
