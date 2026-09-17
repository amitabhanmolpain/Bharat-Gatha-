import re
import sys

def check_jsx_tags(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    tags = []
    
    for i, line in enumerate(lines):
        # Extremely simplified and might fail on complex JSX, but can give a hint
        # Find opening tags <tag> or <tag attrs...> but ignore self closing <tag /> and ignore <? ?>
        opening = re.findall(r'<([a-zA-Z0-9_]+)(?:[^>]*[^/])?>', line)
        closing = re.findall(r'</([a-zA-Z0-9_]+)>', line)
        self_closing = re.findall(r'<([a-zA-Z0-9_]+)[^>]*/>', line)
        
        # also ignore empty tags <> and </>
        
        # Actually it's better to just do a stack-based parser
        pass

    # A better way is just to run tsc or eslint on it to pinpoint
check_jsx_tags(sys.argv[1])
