import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken import
content = content.replace('setStage1Complete, setStage2Complete, setStage3Complete, setStage4Complete,', 'setStage1Complete, setStage2Complete, setStage3Complete, setStage4Complete,\n  setHasRecruitedHistorian,')

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Import fixed!")
