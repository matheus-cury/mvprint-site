"""Package a built site for Cloudflare Pages' 1,000-file dashboard limit.

Usage: python scripts/package-deploy.py path/to/mvprint.zip
Original repository assets remain untouched; only unused client-logo copies and
the internal logo README are omitted from this deployment archive.
"""
from pathlib import Path
import re
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
if not (dist / 'index.html').is_file():
    raise SystemExit('Run npm run build first.')
html = '\n'.join(p.read_text(encoding='utf-8') for p in dist.rglob('*.html'))
used_logos = set(re.findall(r'/images/logos/[^"\s<>]+', html))
files = []
for path in sorted(dist.rglob('*')):
    if not path.is_file():
        continue
    relative = path.relative_to(dist).as_posix()
    if relative.startswith('images/logos/') and '/' + relative not in used_logos:
        continue
    files.append((path, relative))
if len(files) > 1000:
    raise SystemExit(f'{len(files)} files exceed the dashboard limit. Deploy dist using Wrangler instead.')
target = Path(sys.argv[1]).resolve()
target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path, relative in files:
        archive.write(path, relative)
print(f'{target}: {len(files)} files, {target.stat().st_size:,} bytes')
