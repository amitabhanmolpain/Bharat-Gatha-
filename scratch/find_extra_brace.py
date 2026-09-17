import sys

def check_js_brace(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    stack = []
    # ignoring strings is better, but let's just see when it hits 0
    in_string = False
    str_char = ''
    for i, line in enumerate(lines[:589]):
        j = 0
        while j < len(line):
            char = line[j]
            if not in_string:
                if char in "'\"`":
                    in_string = True
                    str_char = char
                elif char == '{':
                    stack.append(('{', i+1))
                elif char == '}':
                    if stack:
                        stack.pop()
                        if not stack:
                            print(f"Stack became empty (function closed) at line {i+1}")
            else:
                if char == str_char and line[j-1] != '\\':
                    in_string = False
            j += 1
            
    print("Final stack size:", len(stack))

check_js_brace(sys.argv[1])
