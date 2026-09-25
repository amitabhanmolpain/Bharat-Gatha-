import re

with open('frontend/app/play/vijayanagara/constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Expand bounds for anegundi_river_crossing
old_bounds = """    anegundi_river_crossing: {
      title: "Tungabhadra River Crossing",
      era: "1336 AD",
      subtitle: "The northern bank where coracles cross into history",
      backgroundImage: "/bg-vijayanagara-anegundi-river.jpg",
      defaultObjective: "Explore the riverbank and speak with the wise elder across the water.",
      minX: 18.0,
      maxX: 82.0,
      minY: 54.0,
      maxY: 88.0,
    },"""

new_bounds = """    anegundi_river_crossing: {
      title: "Tungabhadra River Crossing",
      era: "1336 AD",
      subtitle: "The northern bank where coracles cross into history",
      backgroundImage: "/bg-vijayanagara-anegundi-river.jpg",
      defaultObjective: "Explore the riverbank and speak with the wise elder across the water.",
      minX: 5.0,
      maxX: 95.0,
      minY: 10.0,
      maxY: 95.0,
    },"""

content = content.replace(old_bounds, new_bounds)

with open('frontend/app/play/vijayanagara/constants.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Constants bounds expanded")
