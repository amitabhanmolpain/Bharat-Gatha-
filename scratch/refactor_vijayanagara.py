import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
imports = """import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  setStage1Complete, setStage2Complete, setStage3Complete, setStage4Complete,
  setHasVidyaranyaBlessing, setHasMetVidyaranya, setIsChowkaBaraComplete,
  setIsFestivalSceneRestored, setIsLedgerAssembled, setIsCampaignComplete
} from '../../store/slices/progressionSlice';
import {
  addJournalEntry, setJournalEntries, addCollectedFragment,
  setHasJournalToy, setHasFinalKeepsake,
  setHasFirstLedgerFragment, setHasSecondLedgerFragment, setHasFinalLedgerFragment
} from '../../store/slices/inventorySlice';
import { setIsSoundMuted, setIsMusicMuted, setIsTimerVisible } from '../../store/slices/settingsSlice';
"""
content = content.replace('import React, { useState, useEffect, useCallback, useRef } from "react";', 'import React, { useState, useEffect, useCallback, useRef } from "react";\n' + imports)

# 2. Add dispatch
content = content.replace('export default function VijayanagaraGameScreen() {', 'export default function VijayanagaraGameScreen() {\n  const dispatch = useAppDispatch();')

# 3. Replace state definitions
replacements = {
    # Progression
    r'const \[hasMetVidyaranya, setHasMetVidyaranya\] = useState\(false\);': 'const hasMetVidyaranya = useAppSelector(state => state.progression.hasMetVidyaranya);',
    r'const \[isChowkaBaraComplete, setIsChowkaBaraComplete\] = useState\(false\);': 'const isChowkaBaraComplete = useAppSelector(state => state.progression.isChowkaBaraComplete);',
    r'const \[hasVidyaranyaBlessing, setHasVidyaranyaBlessing\] = useState\(false\);': 'const hasVidyaranyaBlessing = useAppSelector(state => state.progression.hasVidyaranyaBlessing);',
    r'const \[isStage1Complete, setIsStage1Complete\] = useState\(false\);': 'const isStage1Complete = useAppSelector(state => state.progression.isStage1Complete);',
    r'const \[isStage2Complete, setIsStage2Complete\] = useState\(false\);': 'const isStage2Complete = useAppSelector(state => state.progression.isStage2Complete);',
    r'const \[isStage3Complete, setIsStage3Complete\] = useState\(false\);': 'const isStage3Complete = useAppSelector(state => state.progression.isStage3Complete);',
    r'const \[isFestivalSceneRestored, setIsFestivalSceneRestored\] = useState\(false\);': 'const isFestivalSceneRestored = useAppSelector(state => state.progression.isFestivalSceneRestored);',
    r'const \[isLedgerAssembled, setIsLedgerAssembled\] = useState\(false\);': 'const isLedgerAssembled = useAppSelector(state => state.progression.isLedgerAssembled);',
    r'const \[isCampaignComplete, setIsCampaignComplete\] = useState\(false\);': 'const isCampaignComplete = useAppSelector(state => state.progression.isCampaignComplete);',
    
    # Inventory
    r'const \[hasFirstLedgerFragment, setHasFirstLedgerFragment\] = useState\(false\);': 'const hasFirstLedgerFragment = useAppSelector(state => state.inventory.hasFirstLedgerFragment);',
    r'const \[hasSecondLedgerFragment, setHasSecondLedgerFragment\] = useState\(false\);': 'const hasSecondLedgerFragment = useAppSelector(state => state.inventory.hasSecondLedgerFragment);',
    r'const \[hasFinalLedgerFragment, setHasFinalLedgerFragment\] = useState\(false\);': 'const hasFinalLedgerFragment = useAppSelector(state => state.inventory.hasFinalLedgerFragment);',
    r'const \[hasJournalToy, setHasJournalToy\] = useState\(false\);': 'const hasJournalToy = useAppSelector(state => state.inventory.hasJournalToy);',
    r'const \[hasFinalKeepsake, setHasFinalKeepsake\] = useState\(false\);': 'const hasFinalKeepsake = useAppSelector(state => state.inventory.hasFinalKeepsake);',
    
    # Settings (Wait, we didn't see isSoundMuted in Vijayanagara page, let's skip to be safe)
}

for pattern, repl in replacements.items():
    content = re.sub(pattern, repl, content)

# 4. Replace Journal state (multi-line)
journal_pattern = r'const \[unlockedJournalEntries, setUnlockedJournalEntries\] = useState<string\[\]>\(\[\s*"anegundi_origin",\s*"vidyaranya_sage",\s*\]\);'
journal_repl = 'const unlockedJournalEntries = useAppSelector(state => state.inventory.unlockedJournalEntries);'
content = re.sub(journal_pattern, journal_repl, content)

# 5. Replace Setters
setter_replacements = {
    r'setHasMetVidyaranya\((.*?)\)': r'dispatch(setHasMetVidyaranya(\1))',
    r'setIsChowkaBaraComplete\((.*?)\)': r'dispatch(setIsChowkaBaraComplete(\1))',
    r'setHasVidyaranyaBlessing\((.*?)\)': r'dispatch(setHasVidyaranyaBlessing(\1))',
    r'setIsStage1Complete\((.*?)\)': r'dispatch(setStage1Complete(\1))',
    r'setIsStage2Complete\((.*?)\)': r'dispatch(setStage2Complete(\1))',
    r'setIsStage3Complete\((.*?)\)': r'dispatch(setStage3Complete(\1))',
    r'setIsFestivalSceneRestored\((.*?)\)': r'dispatch(setIsFestivalSceneRestored(\1))',
    r'setIsLedgerAssembled\((.*?)\)': r'dispatch(setIsLedgerAssembled(\1))',
    r'setIsCampaignComplete\((.*?)\)': r'dispatch(setIsCampaignComplete(\1))',
    r'setHasFirstLedgerFragment\((.*?)\)': r'dispatch(setHasFirstLedgerFragment(\1))',
    r'setHasSecondLedgerFragment\((.*?)\)': r'dispatch(setHasSecondLedgerFragment(\1))',
    r'setHasFinalLedgerFragment\((.*?)\)': r'dispatch(setHasFinalLedgerFragment(\1))',
    r'setHasJournalToy\((.*?)\)': r'dispatch(setHasJournalToy(\1))',
    r'setHasFinalKeepsake\((.*?)\)': r'dispatch(setHasFinalKeepsake(\1))',
    r'setUnlockedJournalEntries\(\(prev\) => \[\.\.\.prev, (.*?)\]\)': r'dispatch(addJournalEntry(\1))',
    r'setUnlockedJournalEntries\((.*?)\)': r'dispatch(setJournalEntries(\1))',
}

for pattern, repl in setter_replacements.items():
    content = re.sub(pattern, repl, content)

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
