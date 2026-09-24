// Hero: entrada coreografada, título em registro CMYK e a "prensa" que troca
// as fotos de trabalhos: o cabeçote desce e revela a próxima foto, nítida.
import { $, $$, reducedMotion, watchVisibility } from './lib';

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

  setTimeout(() => reg.classList.remove('is-ink'), 2300);
}

// ---------- Prensa ----------

function initPress(hero: HTMLElement) {
  const figure = $('[data-press]', hero);
  const stage = $('.press-stage', hero);
  if (!figure || !stage) return;
  watchVisibility(figure, visible => { if (visible) figure.classList.add('is-in'); }, '0px 0px -10% 0px');

  const photos = $$<HTMLAnchorElement>('.press-photo', stage);
  const head = $('.press-head', stage);
  if (photos.length < 2 || !head) return;

  const indexLabel = $('[data-press-index]', figure);
  const clientLabel = $('[data-press-client]', figure);
  const serviceLabel = $('[data-press-service]', figure);
  const status = $('[data-press-status]', figure);
  const pauseButton = $<HTMLButtonElement>('[data-press-pause]', figure);
  const timer = $('.press-timer', figure);
  const reduced = reducedMotion();
  const HOLD = 5600;
  const PRINT = 1500;
  const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

  let index = 0;
  let busy = false;
  let paused = reduced;
  let hovering = false;
  let inView = false;
  let started = false;
  let holdTimer = 0;

  const imageOf = (i: number) => photos[i].querySelector('img');

  /** Garante que a foto está baixada e decodificada antes de imprimir. */
  const ready = (i: number) => {
    const image = imageOf(i);
    if (!image) return Promise.reject(new Error('sem imagem'));
    image.loading = 'eager';
    if (image.complete && image.naturalWidth) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => reject(new Error('falhou')), { once: true });
    });
  };

  const setCaption = (i: number, announce: boolean) => {
    const { client = '', service = '' } = photos[i].dataset;
    if (indexLabel) indexLabel.textContent = String(i + 1).padStart(2, '0');
    if (clientLabel) clientLabel.textContent = client;
    if (serviceLabel) serviceLabel.textContent = service;
    if (announce && status) status.textContent = `${client}: ${service}`;
  };

  const schedule = () => {
    clearTimeout(holdTimer);
    timer?.classList.remove('is-running');
    if (paused || hovering || !inView || document.hidden || busy) return;
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
    const next = (target + photos.length) % photos.length;
    try {
      await ready(next);
      const incoming = photos[next];
      const outgoing = photos[index];
      setCaption(next, announce);
      incoming.classList.add('is-next');
      if (!reduced) {
        const height = stage.clientHeight;
        head.classList.add('is-on');
        await Promise.all([
          incoming.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: PRINT, easing: EASE }).finished,
          head.animate([{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(0, ${height}px, 0)` }], { duration: PRINT, easing: EASE, fill: 'forwards' }).finished,
        ]);
        head.classList.remove('is-on');
        head.getAnimations().forEach(animation => animation.cancel());
      }
      outgoing.classList.remove('is-current');
      outgoing.inert = true;
      outgoing.setAttribute('aria-hidden', 'true');
      incoming.classList.remove('is-next');
      incoming.classList.add('is-current');
      incoming.inert = false;
      incoming.removeAttribute('aria-hidden');
      index = next;
    } catch {
      // Foto com erro: pula para a seguinte na próxima volta.
      index = next;
    } finally {
      busy = false;
      ready((index + 1) % photos.length).catch(() => undefined);
      schedule();
    }
  };

  stage.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    schedule();
  });
  stage.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = false;
    schedule();
  });

  $('[data-press-prev]', figure)?.addEventListener('click', () => show(index - 1, true));
  $('[data-press-next]', figure)?.addEventListener('click', () => show(index + 1, true));
  pauseButton?.addEventListener('click', () => {
    paused = !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    schedule();
  });
  if (reduced) pauseButton?.setAttribute('aria-pressed', 'true');

  watchVisibility(stage, visible => {
    inView = visible;
    if (visible && !started) {
      started = true;
      ready(1).catch(() => undefined);
    }
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
}
