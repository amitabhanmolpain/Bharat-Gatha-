import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the animated boats section completely
boats_regex = re.compile(r'\{\/\* --- ANIMATED BOATS IN WATER ---\s*\*\/\}.*?\{\/\* --- UNCLE COMPANION NPC ---\s*\*\/\}', re.DOTALL)
content = re.sub(boats_regex, '{/* --- UNCLE COMPANION NPC --- */}', content)

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed the Egyptian boats")
