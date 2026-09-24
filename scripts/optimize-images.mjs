import { mkdir, readdir, rename, stat, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Bound native memory use even on machines with little free RAM.
sharp.cache(false);
sharp.concurrency(1);

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'public/images/portfolio');
const output = path.join(root, 'public/images/optimized');
const recipeModified = (await stat(fileURLToPath(import.meta.url))).mtimeMs;
await mkdir(output, { recursive: true });
const files = (await readdir(source)).filter(file => /\.jpg$/i.test(file));
const expected = new Set(files.flatMap(file => [480, 960].map(width => `${path.parse(file).name}-${width}.webp`)));
// Reconcile only this script's generated files; source photographs are never deleted.
for (const file of await readdir(output)) {
  if (/-(480|960)\.webp$/.test(file) && !expected.has(file)) await unlink(path.join(output, file));
}
let generated = 0;
// Sequential processing keeps memory use bounded on local and CI builds.
for (const file of files) {
  const input = path.join(source, file);
  const modified = (await stat(input)).mtimeMs;
  for (const width of [480, 960]) {
    const target = path.join(output, `${path.parse(file).name}-${width}.webp`);
    if ((await stat(target).catch(() => null))?.mtimeMs >= Math.max(modified, recipeModified)) continue;
    // Publish only a complete variant, so a failed encoder cannot leave a
    // partial target that a later build mistakes for an up-to-date image.
    const temporary = `${target}.${process.pid}-${randomUUID()}.tmp`;
    try {
      await sharp(input).rotate().resize({ width }).webp({ quality: 78 }).toFile(temporary);
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    generated++;
  }
}
console.log(`Images: ${files.length} originals preserved, ${generated} responsive variants generated.`);
