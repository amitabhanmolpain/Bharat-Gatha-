import sys

def check_brace(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    stack = []
    for i, line in enumerate(lines[:589]):
        for char in line:
            if char == '{':
                stack.append(('{', i+1))
            elif char == '}':
                if not stack:
                    print(f"Extra }} at line {i+1}")
                    return
                stack.pop()
    print("Unclosed in JS:", len(stack))

check_brace(sys.argv[1])
