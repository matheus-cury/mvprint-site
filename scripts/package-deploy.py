"""Validate and package a build for Cloudflare Pages' 1,000-file dashboard limit.

Usage: python scripts/package-deploy.py path/to/mvprint.zip
Original files are preserved. Only unused client logos and their internal README
are omitted; CSS references, query strings and JavaScript logo collections are kept.
"""
from html import unescape
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import unquote
import os
import runpy
import shutil
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
validate = runpy.run_path(str(ROOT / 'scripts/validate-build.py'))['validate']


def package(dist, target):
    dist, target = Path(dist).resolve(), Path(target).resolve()
    if target.is_relative_to(dist):
        raise ValueError('The deployment archive must be outside dist to avoid including or overwriting itself.')
    errors, _, _ = validate(dist)
    if errors:
        raise ValueError('Build validation failed:\n' + '\n'.join(errors))

    # Keeping an extra logo is safer than losing an asset. Dynamic JS/JSON
    # collections retain all logos because their filenames cannot be inferred.
    source_text = ''
    dynamic_logos = False
    for path in dist.rglob('*'):
        if path.suffix.lower() in ('.html', '.css', '.js', '.mjs', '.json', '.svg') and path.is_file():
            text = unquote(unescape(path.read_text(encoding='utf-8'))).replace('\\/', '/')
            source_text += '\n' + text
            if path.suffix.lower() in ('.js', '.mjs', '.json') and 'logos' in text.lower():
                dynamic_logos = True
    files = []
    for path in sorted(dist.rglob('*')):
        if not path.is_file():
            continue
        relative = path.relative_to(dist).as_posix()
        if relative.startswith('images/logos/') and not dynamic_logos and path.name not in source_text:
            continue
        files.append((path, relative))
    if len(files) > 1000:
        raise ValueError(f'{len(files)} files exceed the dashboard limit. Deploy the complete dist using Wrangler instead; no files were removed.')

    target.parent.mkdir(parents=True, exist_ok=True)
    # Validate the exact payload. Atomically publish only the completed ZIP so a
    # validation/compression failure cannot replace an existing good archive.
    with TemporaryDirectory(prefix='mvprint-package-', dir=target.parent) as temporary:
        staging = Path(temporary) / 'site'
        for path, relative in files:
            destination = staging / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)
        errors, _, _ = validate(staging)
        if errors:
            raise ValueError('Packaged build validation failed:\n' + '\n'.join(errors))
        archive_path = Path(temporary) / 'site.zip'
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for _, relative in files:
                archive.write(staging / relative, relative)
        os.replace(archive_path, target)
    return len(files)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/package-deploy.py path/to/mvprint.zip')
    target = Path(sys.argv[1]).resolve()
    try:
        count = package(ROOT / 'dist', target)
    except ValueError as error:
        raise SystemExit(str(error))
    print(f'{target}: {count} files, {target.stat().st_size:,} bytes')
