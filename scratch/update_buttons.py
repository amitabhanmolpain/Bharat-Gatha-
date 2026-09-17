import re

with open(r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\app\play\indus\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Navigation Buttons (E / F)
def nav_replacer(match):
    key = match.group(1)
    text = match.group(2).strip()
    
    # Remove leading arrow symbols if present in the text part
    text = re.sub(r'^[▼▲]\s*', '', text)
    
    return f'<div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{key}</div>\n                <span>{text}</span>'

content = re.sub(r'<span>\s*(?:[▼▲]\s*)?\[([EF])\]\s*(.*?)</span>', nav_replacer, content)

# Replace Inspect Buttons (G) - old black style
def inspect_replacer(match):
    text = match.group(1).strip()
    return f'<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 whitespace-nowrap">\n                  <div className="bg-[#ffb000] border-[1.5px] border-black text-black rounded-sm px-1 py-0 text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">G</div>\n                  <span>{text}</span>\n                </div>'

content = re.sub(r'<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/70 text-white px-2 py-1 rounded text-xs whitespace-nowrap">\s*<span className="text-\[#d8a86a\] font-bold mr-1">\[G\]</span>\s*(.*?)\s*</div>', inspect_replacer, content)

# Also check for bg-[#1b1510]/90 tooltips
def old_tooltip_replacer(match):
    text = match.group(1).strip()
    return f'<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#fffdf5] border-[1.5px] border-black text-black px-1.5 py-0.5 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 whitespace-nowrap">\n                <span>{text}</span>\n              </div>'

content = re.sub(r'<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-\[#1b1510\]/90 border border-\[#d8a86a\]/60 text-\[#f7eedf\] px-2\.5 py-1 rounded text-\[11px\] font-serif shadow-md whitespace-nowrap">\s*<span>(.*?)</span>\s*</div>', old_tooltip_replacer, content)

with open(r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\app\play\indus\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating buttons!")
