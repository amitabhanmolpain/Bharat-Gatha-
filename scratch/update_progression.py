import re

with open('frontend/app/store/slices/progressionSlice.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add to interface
content = content.replace('isCampaignComplete: boolean;', 'isCampaignComplete: boolean;\n  hasRecruitedHistorian: boolean;')

# Add to initialState
content = content.replace('isCampaignComplete: false,', 'isCampaignComplete: false,\n  hasRecruitedHistorian: false,')

# Add to reducers
reducer_insertion = """    setHasRecruitedHistorian: (state, action: PayloadAction<boolean>) => {
      state.hasRecruitedHistorian = action.payload;
    },
"""
content = content.replace('setCampaignComplete: (state, action: PayloadAction<boolean>) => {', reducer_insertion + '    setCampaignComplete: (state, action: PayloadAction<boolean>) => {')

with open('frontend/app/store/slices/progressionSlice.ts', 'w', encoding='utf-8') as f:
    f.write(content)

with open('frontend/app/store/store.ts', 'r', encoding='utf-8') as f:
    store_content = f.read()
    
# Export the action
export_str = 'export const { '
export_idx = content.find(export_str)
if export_idx != -1:
    end_idx = content.find('}', export_idx)
    exports = content[export_idx + len(export_str):end_idx]
    if 'setHasRecruitedHistorian' not in exports:
        content = content.replace(exports, exports + ', setHasRecruitedHistorian')
        with open('frontend/app/store/slices/progressionSlice.ts', 'w', encoding='utf-8') as f:
            f.write(content)
            
print("progressionSlice updated")
