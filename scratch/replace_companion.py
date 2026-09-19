import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace image source
content = content.replace('/genie_rajasthani_transparent.png', '/uncle_companion.png')

# Replace character name and title
content = content.replace('Jolly Bhai', 'Uncle')
content = content.replace('jolly_bhai', 'uncle')
content = content.replace('Jolly Bhai Genie', 'Uncle Companion')
content = content.replace('Ancient Time-Traveling Genie Companion', 'Time-Traveling Uncle Companion')

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced Jolly Bhai with Uncle Companion")
