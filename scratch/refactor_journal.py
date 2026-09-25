import re

with open('frontend/app/play/vijayanagara/components/JournalModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = """import { useAppSelector } from '../../../store/hooks';
"""
content = content.replace('import React, { useState } from "react";', 'import React, { useState } from "react";\n' + imports)

# Remove props from interface
content = content.replace('  unlockedEntryIds: string[];\n  collectedFragmentIds: string[];\n', '')
# Remove props from component args
content = content.replace('  unlockedEntryIds,\n  collectedFragmentIds,\n', '')

# Insert selectors
hook_insertion = """  const unlockedEntryIds = useAppSelector(state => state.inventory.unlockedJournalEntries);
  const collectedFragmentIds = useAppSelector(state => state.inventory.collectedFragments);
"""
content = content.replace('const [activeCategory, setActiveCategory] = useState<JournalCategory>("FOUNDING");', hook_insertion + '  const [activeCategory, setActiveCategory] = useState<JournalCategory>("FOUNDING");')

with open('frontend/app/play/vijayanagara/components/JournalModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    page_content = f.read()

# Remove passed props in page.tsx
page_content = page_content.replace('unlockedEntryIds={unlockedJournalEntries}', '')
page_content = page_content.replace('collectedFragmentIds={collectedFragments}', '')

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_content)
    
print("Done")
