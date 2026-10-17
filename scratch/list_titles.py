import glob, re

import sys
sys.stdout.reconfigure(encoding='utf-8')

for f in sorted(glob.glob('project-*.html')):
    txt = open(f, encoding='utf-8').read()
    title = re.search(r'<title>(.*?)</title>', txt)
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', txt, re.S)
    h1_clean = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else 'None'
    t_str = title.group(1) if title else 'None'
    print(f"{f:26} | title: {t_str} | h1: {h1_clean}")
