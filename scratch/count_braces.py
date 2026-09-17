import sys
import re

def count_braces(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # naive count of '{' and '}'
    open_count = content.count('{')
    close_count = content.count('}')

    print(f"Total open: {open_count}")
    print(f"Total close: {close_count}")

count_braces(sys.argv[1])
