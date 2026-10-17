import os
import re

files = [
    'project-ekater-park.html', 'project-suomen.html', 'project-nomer-otel.html',
    'project-pub-tagil.html', 'project-a-frames.html', 'project-hmao.html',
    'project-sochi-kvartira.html', 'project-andr-fateevo.html', 'project-gorbunovo-2fl.html',
    'project-artu-40m2.html', 'project-kris-ggm.html', 'project-banniy-kompl.html'
]

for f in files:
    content = open(f, encoding='utf-8').read()
    title = re.search(r'<title>(.*?)</title>', content)
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content)
    next_case = re.search(r'<div class="next-case-bar">.*?<a href="([^"]+)".*?<span>(.*?)</span>', content, re.DOTALL)
    specs = re.findall(r'<span class="spec-label">(.*?)</span>\s*<span class="spec-value">(.*?)</span>', content)
    capsule = re.search(r'<div class="matte-capsule">(.*?)</div>', content)
    
    print(f'FILE: {f}')
    print(f'  Title: {title.group(1) if title else "None"}')
    print(f'  H1: {h1.group(1) if h1 else "None"}')
    print(f'  Capsule: {capsule.group(1) if capsule else "None"}')
    print(f'  Specs: {specs}')
    if next_case:
        print(f'  Next case: {next_case.group(1)} -> {next_case.group(2).strip()}')
    print()
