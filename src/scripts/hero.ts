// Hero: entrada coreografada, título em registro CMYK e a prensa em retícula.
import { initImageFades } from './core';
import { Press, type PressTexture } from './halftone';
import { $, $$, clamp, finePointer, lerp, reducedMotion, scrollVelocity, watchVisibility } from './lib';

interface PrintData { src: string; full: string; client: string; service: string; focus: [number, number]; zoom: number; slug: string }

export function initHero() {
  const hero = $('[data-hero]');
  if (!hero) return;

  const fontsReady = Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise(resolve => setTimeout(resolve, 1200)),
  ]);

  fontsReady.then(() => requestAnimationFrame(() => {
    $$('[data-hero-in]', hero).forEach(element => element.classList.add('is-in'));
    const lines = $$('.hero-title .line', hero);
    lines.forEach(line => line.classList.add('is-in'));
    // Depois de subir, as linhas deixam as bordas coloridas "vazarem".
    setTimeout(() => lines.forEach(line => line.classList.add('is-done')), 1700);
    startRegistration(hero);
  }));

  initPress(hero);
}

// ---------- Título: camadas C, M e Y entram em registro e reagem ao mouse ----------

function startRegistration(hero: HTMLElement) {
  const reg = $('[data-reg]', hero);
  if (!reg) return;
  if (reducedMotion()) return;

  // Começa desalinhado e "acerta o registro".
  reg.style.setProperty('--rx', '18px');
  reg.style.setProperty('--ry', '10px');
  reg.classList.add('is-ink');
  setTimeout(() => {
    reg.style.setProperty('--rx', '0px');
    reg.style.setProperty('--ry', '0px');
  }, 550);

  let ready = false;
  let visible = true;
  let tx = 0, ty = 0, x = 0, y = 0;
  let frame = 0;
  setTimeout(() => { reg.classList.remove('is-ink'); ready = true; }, 2300);

  const loop = () => {
    frame = 0;
    if (!ready || !visible) return;
    const velocity = scrollVelocity();
    const targetX = tx + clamp(velocity * 6, -14, 14);
    const targetY = ty + clamp(velocity * 10, -18, 18);
    x = lerp(x, targetX, 0.12);
    y = lerp(y, targetY, 0.12);
    reg.style.setProperty('--rx', `${x.toFixed(2)}px`);
    reg.style.setProperty('--ry', `${y.toFixed(2)}px`);
    if (Math.abs(x - targetX) + Math.abs(y - targetY) > 0.05 || Math.abs(velocity) > 0.01) frame = requestAnimationFrame(loop);
  };
  const kick = () => { if (!frame) frame = requestAnimationFrame(loop); };

  if (finePointer()) {
    addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      tx = (event.clientX / innerWidth - 0.5) * 9;
      ty = (event.clientY / innerHeight - 0.5) * 7;
      kick();
    }, { passive: true });
  }
  addEventListener('scroll', kick, { passive: true });
  watchVisibility(hero, isVisible => { visible = isVisible; if (isVisible) kick(); });
}

// ---------- Prensa ----------

function initPress(hero: HTMLElement) {
  const figure = $('[data-press]', hero);
  const canvas = $<HTMLCanvasElement>('.press-canvas', hero);
  const stage = $('.press-stage', hero);
  const dataTag = $('[data-press-prints]', hero);
  if (!figure || !canvas || !stage || !dataTag) return;

  watchVisibility(figure, visible => { if (visible) figure.classList.add('is-in'); }, '0px 0px -10% 0px');

  const prints: PrintData[] = JSON.parse(dataTag.textContent || '[]');
  // Sem WebGL (ou se a foto falhar), mostra a foto comum no lugar da retícula.
  const fallback = () => {
    figure.classList.remove('gl');
    figure.classList.add('no-gl');
    const template = $<HTMLTemplateElement>('template[data-press-fallback]', figure);
    if (template && !stage.querySelector('picture')) {
      stage.prepend(template.content.cloneNode(true));
      initImageFades(stage);
    }
  };
  const press = Press.create(canvas, { cell: 7.5, paper: [0.984, 0.976, 0.957] });
  if (!press || !prints.length) {
    fallback();
    return;
  }
  figure.classList.add('gl');

  const head = $('.press-head', figure)!;
  const loupe = $<SVGSVGElement>('.press-loupe', figure);
  const indexLabel = $('[data-press-index]', figure);
  const clientLabel = $('[data-press-client]', figure);
  const serviceLabel = $('[data-press-service]', figure);
  const status = $('[data-press-status]', figure);
  const toggle = $<HTMLButtonElement>('[data-press-toggle]', figure);
  const hint = $('[data-press-hint]', figure);
  const pauseButton = $<HTMLButtonElement>('[data-press-pause]', figure);
  const timer = $('.press-timer', figure);
  const reduced = reducedMotion();
  const HOLD = 5200;

  const textures: Promise<PressTexture>[] = [];
  // Em telas grandes de alta densidade usa a foto inteira, para a lupa ficar nítida
  // (a mesma regra do <link rel="preload"> da página).
  const sharp = matchMedia('(min-width: 1024px) and (min-resolution: 1.5dppx)').matches;
  const load = (index: number) => {
    const i = (index + prints.length) % prints.length;
    textures[i] ??= press.load(sharp ? prints[i].full : prints[i].src, prints[i].focus, prints[i].zoom);
    return textures[i];
  };

  let index = 0;
  let started = false;
  let busy = false;
  let paused = reduced;
  let hovering = false;
  let revealed = false;
  let inView = false;
  let holdTimer = 0;
  let pointer = { x: 0, y: 0 };

  const size = () => stage.getBoundingClientRect();

  press.onFrame = ({ lensX, lensY, lensR, front, printing }) => {
    if (loupe) {
      const visible = lensR > 6 && !revealed;
      loupe.style.opacity = visible ? '1' : '0';
      loupe.style.transform = `translate3d(${lensX}px, ${lensY}px, 0) scale(${(lensR / 100).toFixed(3)})`;
    }
    if (printing) head.style.transform = `translate3d(0, ${(front * size().height).toFixed(1)}px, 0)`;
  };

  const setCaption = (i: number, announce: boolean) => {
    const print = prints[i];
    if (indexLabel) indexLabel.textContent = String(i + 1).padStart(2, '0');
    if (clientLabel) clientLabel.textContent = print.client;
    if (serviceLabel) serviceLabel.textContent = print.service;
    canvas.setAttribute('aria-label', `${print.service} para ${print.client}, impresso em retícula`);
    if (announce && status) status.textContent = `${print.client}: ${print.service}`;
  };

  const schedule = () => {
    clearTimeout(holdTimer);
    timer?.classList.remove('is-running');
    if (paused || hovering || revealed || !inView || document.hidden || busy) return;
    if (timer) {
      timer.style.setProperty('--t', `${HOLD}ms`);
      void timer.getBoundingClientRect();
      timer.classList.add('is-running');
    }
    holdTimer = window.setTimeout(() => show(index + 1, false), HOLD);
  };

  const show = async (target: number, announce: boolean) => {
    if (busy) return;
    busy = true;
    clearTimeout(holdTimer);
    timer?.classList.remove('is-running');
    index = (target + prints.length) % prints.length;
    setCaption(index, announce);
    try {
      const texture = await load(index);
      if (revealed) setReveal(false);
      head.classList.add('is-on');
      await press.print(texture, reduced ? 0 : 1800);
    } catch {
      // Se uma foto falhar, segue para a próxima na próxima rodada.
    } finally {
      head.classList.remove('is-on');
      busy = false;
      load(index + 1).catch(() => undefined);
      schedule();
    }
  };

  const setReveal = (on: boolean, x?: number, y?: number) => {
    revealed = on;
    const rect = size();
    const cx = x ?? rect.width / 2;
    const cy = y ?? rect.height / 2;
    const diagonal = Math.hypot(Math.max(cx, rect.width - cx), Math.max(cy, rect.height - cy));
    press.pointer(cx, cy, on ? diagonal + 20 : (hovering && finePointer() ? 92 : 0), on ? 1 : 1.35);
    toggle?.setAttribute('aria-pressed', String(on));
    if (hint) hint.textContent = on ? 'Voltar à retícula' : 'Ver foto original';
    figure.classList.toggle('is-revealed', on);
    if (!on) schedule();
    else { clearTimeout(holdTimer); timer?.classList.remove('is-running'); }
  };

  // Lupa segue o mouse; clique alterna a foto inteira.
  stage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = size();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (!hovering) {
      hovering = true;
      clearTimeout(holdTimer);
      timer?.classList.remove('is-running');
      press.pointer(pointer.x, pointer.y, revealed ? Math.hypot(rect.width, rect.height) : 92, revealed ? 1 : 1.35, true);
    } else if (!revealed) {
      press.pointer(pointer.x, pointer.y, 92, 1.35);
    }
  });
  stage.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = false;
    if (!revealed) press.pointer(pointer.x, pointer.y, 0, 1.35);
    schedule();
  });
  stage.addEventListener('click', event => {
    if ((event.target as Element).closest('[data-press-toggle]')) return;
    const rect = size();
    setReveal(!revealed, event.clientX - rect.left, event.clientY - rect.top);
  });
  toggle?.addEventListener('click', () => setReveal(!revealed));

  $('[data-press-prev]', figure)?.addEventListener('click', () => show(index - 1, true));
  $('[data-press-next]', figure)?.addEventListener('click', () => show(index + 1, true));
  pauseButton?.addEventListener('click', () => {
    paused = !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Retomar troca automática' : 'Pausar troca automática');
    schedule();
  });
  if (reduced) {
    pauseButton?.setAttribute('aria-pressed', 'true');
    pauseButton?.setAttribute('aria-label', 'Retomar troca automática');
  }

  watchVisibility(stage, visible => {
    inView = visible;
    if (visible && !started) {
      started = true;
      // A primeira folha é "impressa" quando a prensa aparece na tela.
      setTimeout(() => show(0, false), reduced ? 0 : 450);
    } else {
      schedule();
    }
  });
  document.addEventListener('visibilitychange', schedule);

  new ResizeObserver(() => press.resize()).observe(stage);
  // Pré-carrega a primeira textura já.
  load(0).catch(fallback);
  canvas.addEventListener('webglcontextlost', fallback);
}
