import sys

def check_balance(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    stack = []
    line_no = 1
    
    for char in content:
        if char == '\n':
            line_no += 1
        elif char in '{(':
            stack.append((char, line_no))
        elif char in '})':
            if not stack:
                print(f"Extra closing {char} at line {line_no}")
                return
            top_char, top_line = stack.pop()
            if (char == '}' and top_char != '{') or (char == ')' and top_char != '('):
                print(f"Mismatched closing {char} at line {line_no} for opening {top_char} at line {top_line}")
                return
                
    if stack:
        print("Unclosed brackets:")
        for char, line in stack:
            print(f"{char} at line {line}")
    else:
        print("All brackets balanced (excluding strings/comments).")

check_balance(sys.argv[1])
