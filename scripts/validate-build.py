"""Check deployable files without opening a browser or contacting external sites.

Usage: python scripts/validate-build.py [build-directory]
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import re
import sys

SITE = 'https://mvprint.com.br'
DEFAULT_DIST = Path(__file__).resolve().parents[1] / 'dist'


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.refs, self.ids, self.duplicates = [], set(), set()
        self.h1 = 0
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.h1 += tag == 'h1'
        element_id = attrs.get('id')
        if element_id:
            if element_id in self.ids:
                self.duplicates.add(element_id)
            self.ids.add(element_id)
        for attribute in ('src', 'href', 'poster', 'data-full-image'):
            if attrs.get(attribute):
                self.refs.append(attrs[attribute])
        srcset = attrs.get('srcset', '')
        if srcset and not srcset.lstrip().startswith('data:'):
            self.refs.extend(part.strip().split()[0] for part in srcset.split(',') if part.strip())


def validate(directory):
    directory = Path(directory).resolve()
    errors, references = [], set()
    for required in ('index.html', '404.html', '_headers', 'robots.txt', 'sitemap.xml'):
        if not (directory / required).is_file():
            errors.append(f'Missing required deployment file: {required}')
    pages = {}
    for path in directory.rglob('*'):
        if path.is_symlink() or not path.resolve().is_relative_to(directory):
            errors.append(f'Symlinks and external files must not be deployed: {path.relative_to(directory)}')
            continue
        if not path.is_file():
            continue
        name = path.relative_to(directory).as_posix()
        if any(part == '.git' or part == '.env' or part.startswith('.env.')
               or part == '.dev.vars' or part.startswith('.dev.vars.') for part in name.lower().split('/')):
            errors.append(f'Private configuration must not be deployed: {name}')
        if path.stat().st_size > 25 * 1024 * 1024:
            errors.append(f'Cloudflare 25 MiB per-file limit exceeded: {name}')
        if path.suffix == '.html':
            page = Page(path.read_text(encoding='utf-8'))
            pages[name] = page
            if page.h1 != 1:
                errors.append(f'{name}: expected one H1, found {page.h1}')
            if page.duplicates:
                errors.append(f'{name}: duplicate IDs: {sorted(page.duplicates)}')
            base = '/' + name.removesuffix('index.html')
            references.update((name, urljoin(SITE + base, ref)) for ref in page.refs)
        elif path.suffix == '.css':
            css = path.read_text(encoding='utf-8')
            references.update((name, urljoin(SITE + '/' + name, ref.strip()))
                              for ref in re.findall(r'url\(\s*[\"\']?([^\"\')]+)', css))
    for source, ref in sorted(references):
        url = urlsplit(ref)
        if url.scheme not in ('http', 'https') or url.netloc != 'mvprint.com.br':
            continue
        relative = unquote(url.path).lstrip('/')
        path = (directory / relative).resolve()
        if not path.is_relative_to(directory):
            errors.append(f'{source}: reference leaves build directory: {ref}')
            continue
        candidates = [path, path / 'index.html']
        if not path.suffix:
            candidates.append(path.with_suffix('.html'))
        target = next((candidate for candidate in candidates if candidate.is_file()), None)
        if target is None:
            errors.append(f'{source}: missing local reference: {ref}')
        elif url.fragment and target.suffix == '.html':
            page = pages.get(target.relative_to(directory).as_posix())
            fragment = unquote(url.fragment)
            # Portfolio hashes select categories in JavaScript; these are data-category values.
            if page and fragment not in page.ids:
                html = target.read_text(encoding='utf-8')
                if f'data-category="{fragment}"' not in html:
                    errors.append(f'{source}: missing anchor: {ref}')
    return errors, len(pages), len(references)


if __name__ == '__main__':
    errors, pages, references = validate(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIST)
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Build validated: {pages} HTML pages, {references} references, no missing local assets.')
