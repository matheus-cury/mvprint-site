import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'public/images/portfolio');
const output = path.join(root, 'public/images/optimized');
await mkdir(output, { recursive: true });
const files = (await readdir(source)).filter(file => /\.jpg$/i.test(file));
let generated = 0;
// Sequential processing keeps memory use bounded on local and CI builds.
for (const file of files) {
  const input = path.join(source, file);
  const modified = (await stat(input)).mtimeMs;
  for (const width of [480, 960]) {
    const target = path.join(output, `${path.parse(file).name}-${width}.webp`);
    if ((await stat(target).catch(() => null))?.mtimeMs >= modified) continue;
    await sharp(input).rotate().resize({ width }).webp({ quality: 78 }).toFile(target);
    generated++;
  }
}
console.log(`Images: ${files.length} originals preserved, ${generated} responsive variants generated.`);
