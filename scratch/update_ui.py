import re
import os

filepath = r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\app\play\indus\page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Tooltips
# They all start with bg-[#1b1510]/95
# Example: <div className="bg-[#1b1510]/95 border-2 border-[#52a45a] text-[#baf1be] px-3.5 py-1.5 rounded-lg text-xs font-serif shadow-xl animate-bounce whitespace-nowrap group-hover:bg-[#251d16] transition-colors flex items-center gap-1.5">
# Or: <div className="mb-2 bg-[#1b1510]/95 border-2 border-[#d8a86a] text-[#f7eedf] px-3 py-1 rounded-lg text-xs font-serif shadow-lg animate-bounce flex items-center gap-1.5 whitespace-nowrap">

def replace_tooltip(match):
    # The new classes
    return 'className="bg-[#fffdf5] border-[3px] border-black text-black px-4 py-2 rounded-xl text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-3 whitespace-nowrap transition-transform hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"'

# Find all tooltip containers
content = re.sub(r'className=\"(?:mb-2 )?bg-\[\#1b1510\]/95[^\"]*\"', replace_tooltip, content)

# 2. Tooltip Inner key spans (e.g., <span className="text-[#d8a86a] font-bold">▲ [E]</span>)
def replace_key_span(match):
    key = match.group(1) # E, F, or G
    # We want: <div className="bg-[#ffb000] border-[2px] border-black text-black rounded px-1.5 py-0.5 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">E</div>
    return f'<div className="bg-[#ffb000] border-[2px] border-black text-black rounded px-1.5 py-0.5 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{key}</div>'

content = re.sub(r'<span className=\"text-\[\#[a-zA-Z0-9]+\] font-bold\">(?:[^\[]*)\[([A-Z])\]</span>', replace_key_span, content)


# Save test output to a scratch file first to verify
with open(r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\scratch\update_ui_test.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated tooltips generated in scratch/update_ui_test.tsx")
