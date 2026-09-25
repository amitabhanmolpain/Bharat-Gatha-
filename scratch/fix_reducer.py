import re

with open('frontend/app/store/slices/progressionSlice.ts', 'r', encoding='utf-8') as f:
    content = f.read()

reducer_insertion = """    setHasRecruitedHistorian: (state, action: PayloadAction<boolean>) => {
      state.hasRecruitedHistorian = action.payload;
    },
"""
content = content.replace('setIsCampaignComplete: (state, action: PayloadAction<boolean>) => {', reducer_insertion + '    setIsCampaignComplete: (state, action: PayloadAction<boolean>) => {')

with open('frontend/app/store/slices/progressionSlice.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reducer added")
