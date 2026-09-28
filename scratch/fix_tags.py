import subprocess

# Get the HEAD version of page.tsx
head_file = subprocess.check_output(['git', 'show', 'HEAD:frontend/app/play/vijayanagara/page.tsx']).decode('utf-8')

# Get the current version of page.tsx
with open('frontend/app/play/vijayanagara/page.tsx', 'r', encoding='utf-8') as f:
    current_file = f.read()

import re

# We will extract all <PedestrianNPC ... /> tags from HEAD, and replace the broken ones in current_file.
# But wait, some tags in HEAD span multiple lines.
def get_tags(content):
    tags = []
    for match in re.finditer(r'<PedestrianNPC[^>]*?/>', content, re.DOTALL):
        tags.append(match.group(0))
    # We also have malformed ones in current_file!
    return tags

# Actually, the malformed ones in current_file don't match `<PedestrianNPC[^>]*?/>` properly if they have weird syntax? No, they still end in `/>` and don't contain `>`.
# Wait, let's just write a script that replaces ALL PedestrianNPC blocks in current_file with the ones from HEAD.
# But we also need to apply the `movement` prop correctly!

# Let's extract tags from HEAD
head_tags = []
for match in re.finditer(r'<PedestrianNPC[^>]*?/>', head_file, re.DOTALL):
    head_tags.append(match.group(0))

current_tags = []
for match in re.finditer(r'<PedestrianNPC[^>]*?/>', current_file, re.DOTALL):
    current_tags.append(match.group(0))

if len(head_tags) == len(current_tags):
    print("Found matching number of tags.")
    new_content = current_file
    for i in range(len(head_tags)):
        old_tag = head_tags[i]
        bad_tag = current_tags[i]
        
        # Now let's properly convert old_tag to movement prop!
        props_to_move = ['path', 'speed', 'loop', 'circular', 'animSpeed']
        movement_props = []
        
        fixed_tag = old_tag
        for prop in props_to_move:
            # Match prop={...} or prop=[...]
            # Use a regex that handles nested brackets if needed.
            # path={[{...}, {...}]}
            # It's safer to just extract using regex for the specific prop name.
            match = re.search(fr'{prop}={{(.*?)}}', fixed_tag, re.DOTALL)
            if not match:
                # try without outer braces? No, React props always have braces unless string.
                pass
            
            # Since path can have nested brackets: path={[{x:1, y:2}, {x:3, y:4}]}
            # The regex `path={({.*?})}` might not work.
            # Let's use a simpler approach.
            pass

        # Since it's hard to parse, let's just restore the HEAD tags and NOT use `movement` prop!
        # Wait, if we restore HEAD tags, we must also revert PedestrianNPC.tsx to NOT use movement prop.
        # It's much easier to revert PedestrianNPC.tsx than to parse React props in Python!
        
        new_content = new_content.replace(bad_tag, old_tag)

    with open('frontend/app/play/vijayanagara/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Restored original tags.")
else:
    print(f"Mismatch: HEAD has {len(head_tags)}, current has {len(current_tags)}")
