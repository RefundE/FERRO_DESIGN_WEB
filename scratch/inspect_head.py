import glob, re, sys
sys.stdout.reconfigure(encoding='utf-8')

for f in sorted(glob.glob('project-*.html')):
    txt = open(f, encoding='utf-8').read()
    t = re.search(r'<title>(.*?)</title>', txt)
    og = re.search(r'<meta property="og:title" content="(.*?)">', txt)
    tw = re.search(r'<meta name="twitter:title" content="(.*?)">', txt)
    print(f"{f:26} | t: {t.group(1) if t else 'NONE'} | og: {og.group(1) if og else 'NONE'} | tw: {tw.group(1) if tw else 'NONE'}")
