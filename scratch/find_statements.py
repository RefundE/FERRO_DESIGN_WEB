# -*- coding: utf-8 -*-
import glob
import re

files = glob.glob('*.html')
for f in files:
    content = open(f, encoding='utf-8').read()
    statements = re.findall(r'<div class="statement-block">.*?</div>', content, re.DOTALL)
    if statements:
        print(f'{f}: {len(statements)} statement-blocks found')
