import re

with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find <PedestrianNPC ... /> tags and rewrite them
def repl(m):
    tag = m.group(0)
    # Extract props
    props_to_move = ['path', 'speed', 'loop', 'circular', 'animSpeed']
    movement_props = []
    
    for prop in props_to_move:
        # Match prop={value} or prop={true/false} or prop=[{...}]
        # This is a bit tricky with regex, but since they are single line mostly:
        match = re.search(fr'{prop}={{(.*?)}}', tag)
        if match:
            movement_props.append(f"{prop}: {match.group(1)}")
            tag = re.sub(fr'{prop}={{.*?}}\s*', '', tag)
    
    if movement_props:
        movement_str = "movement={{ " + ", ".join(movement_props) + " }} "
        # Insert movement_str before the closing />
        tag = tag.replace('/>', f'{movement_str}/>')
        
    return tag

new_content = re.sub(r'<PedestrianNPC[^>]*/>', repl, content)

with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
