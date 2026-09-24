// Utilidades compartilhadas pelos módulos de interação.

export const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => reducedQuery.matches;

const fineQuery = matchMedia('(hover: hover) and (pointer: fine)');
export const finePointer = () => fineQuery.matches;

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Anima um número de `from` a `to` e devolve uma função para cancelar. */
export function tween(
  duration: number,
  onUpdate: (progress: number) => void,
  ease: (t: number) => number = easeInOutCubic,
  onDone?: () => void,
) {
  let frame = 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = clamp((now - start) / duration);
    onUpdate(ease(t));
    if (t < 1) frame = requestAnimationFrame(step);
    else onDone?.();
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

// ---------- Rolagem centralizada (uma leitura de scrollY por quadro) ----------

type ScrollListener = (state: { y: number; delta: number; velocity: number; height: number; viewport: number }) => void;
const scrollListeners = new Set<ScrollListener>();
let lastY = window.scrollY;
let lastTime = performance.now();
let ticking = false;
let velocity = 0;

function emitScroll() {
  ticking = false;
  const y = window.scrollY;
  const now = performance.now();
  const delta = y - lastY;
  const dt = Math.max(1, now - lastTime);
  velocity = lerp(velocity, delta / dt, 0.4);
  lastY = y;
  lastTime = now;
  const state = { y, delta, velocity, height: document.documentElement.scrollHeight, viewport: window.innerHeight };
  scrollListeners.forEach(listener => listener(state));
}

addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(emitScroll);
  }
}, { passive: true });
addEventListener('resize', () => requestAnimationFrame(emitScroll), { passive: true });

export function onScroll(listener: ScrollListener, immediate = true) {
  scrollListeners.add(listener);
  if (immediate) requestAnimationFrame(emitScroll);
  return () => scrollListeners.delete(listener);
}

/** Velocidade atual da rolagem em px/ms (suavizada e decaindo quando a rolagem para). */
export function scrollVelocity() {
  const idle = performance.now() - lastTime;
  return idle > 80 ? velocity * Math.exp(-(idle - 80) / 140) : velocity;
}

/** Chama `callback(true|false)` quando o elemento entra ou sai da tela. */
export function watchVisibility(element: Element, callback: (visible: boolean) => void, rootMargin = '0px') {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => callback(entry.isIntersecting));
  }, { rootMargin });
  observer.observe(element);
  return () => observer.disconnect();
}
