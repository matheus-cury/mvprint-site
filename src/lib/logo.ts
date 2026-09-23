// Logo MV Print para uso inline (só no build). A fonte única é o vetor em
// public/images/logo-mvprint.svg: daqui saem os recortes (símbolo, símbolo +
// "Print" e assinatura completa) e a versão clara para fundos escuros.
import fs from 'node:fs';
import path from 'node:path';

export type LogoVariant = 'mark' | 'symbol' | 'full';
export type LogoTone = 'dark' | 'light';

const SOURCE = path.resolve(process.cwd(), 'public/images/logo-mvprint.svg');

// Enquadramentos medidos no desenho (1 unidade de respiro em volta).
const VIEWBOX: Record<LogoVariant, string> = {
  mark: '9.6 9.4 385 130.4',
  symbol: '9.6 9.4 260.4 130.4',
  full: '1.5 9.4 397.2 255',
};

const PAPER = '#F4EFE7';
const INK = '#16120E';

let source: string | null = null;
let counter = 0;

function read() {
  source ??= fs.readFileSync(SOURCE, 'utf8');
  return source;
}

/** Recorta um <g id="..."> respeitando grupos aninhados. */
function group(svg: string, id: string) {
  const start = svg.indexOf(`<g id="${id}"`);
  if (start < 0) throw new Error(`Logo: grupo "${id}" não encontrado em ${SOURCE}`);
  const tags = /<\/?g\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let match = tags.exec(svg); match; match = tags.exec(svg)) {
    if (match[0].startsWith('</')) depth--;
    else if (!match[0].endsWith('/>')) depth++;
    if (depth === 0) return svg.slice(start, match.index + match[0].length);
  }
  throw new Error(`Logo: grupo "${id}" sem fechamento`);
}

export function logoSvg({ variant = 'mark', tone = 'dark', className = '', label }: {
  variant?: LogoVariant;
  tone?: LogoTone;
  className?: string;
  label?: string;
}) {
  const svg = read();
  const uid = `mvl${++counter}`;
  const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? '';

  const symbol = group(svg, 'simbolo-mv').replace('<g id="simbolo-mv"', '<g class="logo-mv"');
  let print = group(svg, 'print').replace('<g id="print"', '<g class="logo-print"');
  // Cada letra de "Print" recebe um índice para a animação em sequência.
  let letter = 0;
  print = print.replace(/<path /g, () => `<path style="--i:${letter++}" `);

  const parts = [symbol];
  if (variant !== 'symbol') parts.push(print);
  if (variant === 'full') {
    parts.push(group(svg, 'grafica-digital').replace('<g id="grafica-digital"', '<g class="logo-type"'));
    parts.push((svg.match(/<rect id="faixa-colorida"[^>]*\/>/)?.[0] ?? '').replace('id="faixa-colorida"', 'class="logo-bar"'));
    parts.push(group(svg, 'slogan').replace('<g id="slogan"', '<g class="logo-slogan"'));
  }
  let body = parts.join('');

  if (tone === 'light') {
    // Letras em cor de papel; o contorno (que separa o "P" do "V") vira cor de tinta.
    body = body
      .replace('fill="#211928" stroke="#fff"', `fill="${PAPER}" stroke="${INK}"`)
      .replace(/#211928|#2b2034/g, PAPER);
  }

  // IDs únicos por instância (a logo aparece várias vezes na mesma página).
  let markup = defs + body;
  for (const id of ['mv-front-gradient', 'mv-back-gradient', 'spectrum']) {
    markup = markup.replaceAll(`id="${id}"`, `id="${id}-${uid}"`).replaceAll(`url(#${id})`, `url(#${id}-${uid})`);
  }

  const [, , width, height] = VIEWBOX[variant].split(' ').map(Number);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX[variant]}" width="${Math.round(width * 2)}" height="${Math.round(height * 2)}" class="logo logo-${variant} logo-${tone} ${className}" ${a11y}>${markup}</svg>`;
}
