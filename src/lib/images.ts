// Helpers de imagem usados só no build (Node). Lê as dimensões reais das fotos
// para reservar espaço (sem pulo de layout) e montar a grade justificada.
import sharp from 'sharp';
import path from 'node:path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const cache = new Map<string, Promise<{ width: number; height: number }>>();

/** Nome-base de uma foto do portfólio: "tapumes-0bdea117-..." */
export function photoName(src: string): string {
  return src.split('/').pop()!.replace(/\.(jpe?g|webp)$/i, '');
}

/** Caminho público da foto original (.jpg preservado). */
export function photoSrc(name: string): string {
  return `/images/portfolio/${photoName(name)}.jpg`;
}

/** Derivado WebP gerado no prebuild (480 ou 960 px de largura). */
export function optimized(name: string, width: 480 | 960 = 960): string {
  return `/images/optimized/${photoName(name)}-${width}.webp`;
}

/** WebP em tamanho cheio (usado na ampliação do portfólio). */
export function fullWebp(name: string): string {
  return `/images/portfolio/${photoName(name)}.webp`;
}

/** Dimensões já considerando a orientação EXIF. */
export function imageSize(name: string): Promise<{ width: number; height: number }> {
  const file = path.join(PUBLIC_DIR, photoSrc(name));
  let pending = cache.get(file);
  if (!pending) {
    pending = sharp(file).metadata().then(meta => {
      const swap = (meta.orientation ?? 1) >= 5;
      const width = meta.width ?? 4;
      const height = meta.height ?? 3;
      return swap ? { width: height, height: width } : { width, height };
    });
    cache.set(file, pending);
  }
  return pending;
}
