"""Regression tests for deployment failures, isolated from project assets."""
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main, mock
import os
import runpy
import zipfile

ROOT = Path(__file__).resolve().parents[1]
validate = runpy.run_path(str(ROOT / 'scripts/validate-build.py'))['validate']
package = runpy.run_path(str(ROOT / 'scripts/package-deploy.py'))['package']


class DeploymentTests(TestCase):
    def setUp(self):
        self.temporary = TemporaryDirectory(prefix='mvprint-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.dist = self.root / 'dist'
        self.archive = self.root / 'site.zip'
        for name in ('index.html', '404.html'):
            self.write(name, '<h1>Example</h1>')
        for name in ('_headers', 'robots.txt', 'sitemap.xml'):
            self.write(name, 'fixture')

    def write(self, name, content):
        path = self.dist / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')
        return path

    def names(self):
        package(self.dist, self.archive)
        with zipfile.ZipFile(self.archive) as archive:
            return archive.namelist()

    def test_valid_build_packages_required_files(self):
        self.assertEqual(validate(self.dist)[0], [])
        self.assertIn('_headers', self.names())

    def test_missing_asset_is_rejected(self):
        self.write('index.html', '<h1>Test</h1><img src="/missing.webp">')
        with self.assertRaisesRegex(ValueError, 'missing local reference'):
            package(self.dist, self.archive)
        self.assertFalse(self.archive.exists())

    def test_duplicate_id_and_broken_anchor_are_rejected(self):
        self.write('index.html', '<h1 id="x">Test</h1><p id="x">Text</p><a href="#gone">Link</a>')
        errors = '\n'.join(validate(self.dist)[0])
        self.assertIn('duplicate IDs', errors)
        self.assertIn('missing anchor', errors)

    def test_relative_route_and_portfolio_hashes(self):
        self.write('index.html', '<h1>Home</h1><a href="/portfolio#cbf">Portfolio</a>')
        self.write('portfolio/index.html', '<h1>Portfolio</h1><div data-category="cbf"></div><a href="../">Home</a>')
        self.assertEqual(validate(self.dist)[0], [])

    def test_css_logo_with_query_is_preserved(self):
        self.write('index.html', '<h1>Home</h1><link rel="stylesheet" href="/style.css">')
        self.write('style.css', 'body { background: url("/images/logos/client.svg?v=2"); }')
        self.write('images/logos/client.svg', '<svg/>')
        self.assertIn('images/logos/client.svg', self.names())

    def test_html_logo_with_encoded_space_and_query_is_preserved(self):
        self.write('index.html', '<h1>Home</h1><img src="/images/logos/client%20name.svg?v=2">')
        self.write('images/logos/client name.svg', '<svg/>')
        self.assertIn('images/logos/client name.svg', self.names())

    def test_srcset_assets_are_preserved(self):
        self.write('index.html', '<h1>Home</h1><img srcset="/images/logos/a.svg 1x, /images/logos/b.svg 2x">')
        for name in ('a.svg', 'b.svg'):
            self.write('images/logos/' + name, '<svg/>')
        self.assertTrue({'images/logos/a.svg', 'images/logos/b.svg'}.issubset(self.names()))

    def test_dynamic_javascript_keeps_complete_logo_collection(self):
        self.write('app.js', 'const logo = "/images/logos/" + client + ".svg";')
        self.write('images/logos/client.svg', '<svg/>')
        self.assertIn('images/logos/client.svg', self.names())

    def test_unused_logo_omission_never_removes_original(self):
        logo = self.write('images/logos/unused.svg', '<svg/>')
        self.assertNotIn('images/logos/unused.svg', self.names())
        self.assertTrue(logo.exists())

    def test_private_configuration_never_enters_archive(self):
        for name in ('.env.local', '.dev.vars.production', '.ENV', '.git/config'):
            with self.subTest(name=name):
                path = self.write(name, 'DUMMY_TEST_VALUE=not-a-secret')
                with self.assertRaisesRegex(ValueError, 'Private configuration'):
                    package(self.dist, self.archive)
                self.assertFalse(self.archive.exists())
                path.unlink()

    def test_archive_cannot_be_written_inside_dist(self):
        with self.assertRaisesRegex(ValueError, 'outside dist'):
            package(self.dist, self.dist / 'site.zip')

    def test_cloudflare_file_size_limit(self):
        with (self.dist / 'oversize.bin').open('wb') as output:
            output.truncate(25 * 1024 * 1024 + 1)
        with self.assertRaisesRegex(ValueError, '25 MiB'):
            package(self.dist, self.archive)

    def test_dashboard_file_count_limit(self):
        for index in range(996):
            self.write(f'data/{index}.txt', 'fixture')
        with self.assertRaisesRegex(ValueError, '1001 files'):
            package(self.dist, self.archive)
        self.assertFalse(self.archive.exists())

    def test_compression_failure_preserves_previous_archive(self):
        self.archive.write_bytes(b'previous package')
        with mock.patch('zipfile.ZipFile', side_effect=OSError('simulated disk failure')):
            with self.assertRaises(OSError):
                package(self.dist, self.archive)
        self.assertEqual(self.archive.read_bytes(), b'previous package')

    def test_external_symlink_is_rejected(self):
        outside = self.root / 'outside.txt'
        outside.write_text('DUMMY_TEST_VALUE')
        try:
            os.symlink(outside, self.dist / 'exposed.txt')
        except OSError:
            self.skipTest('Creating symlinks requires privileges on this host; tested on Linux CI.')
        with self.assertRaisesRegex(ValueError, 'Symlinks and external files'):
            package(self.dist, self.archive)


if __name__ == '__main__':
    main()
