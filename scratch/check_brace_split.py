import sys

def check_brace(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    js_content = "".join(lines[:589])
    jsx_content = "".join(lines[589:])
    
    print("JS open:", js_content.count('{'), "close:", js_content.count('}'))
    print("JSX open:", jsx_content.count('{'), "close:", jsx_content.count('}'))

check_brace(sys.argv[1])
