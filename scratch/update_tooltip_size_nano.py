import re

filepath = r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\app\play\indus\page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the tooltip container classes
old_container = 'className="bg-[#fffdf5] border-2 border-black text-black px-2.5 py-1 rounded-lg text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-2 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"'
new_container = 'className="bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-1.5 whitespace-nowrap transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"'
content = content.replace(old_container, new_container)

# Replace the key box classes
old_key = 'className="bg-[#ffb000] border-2 border-black text-black rounded px-1 py-0.5 text-[10px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"'
new_key = 'className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"'
content = content.replace(old_key, new_key)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated tooltip sizes to be extra small!')
