// Interações globais: revelações, cursor, cabeçalho, botões magnéticos,
// parallax e letreiros (marquees) que respondem à rolagem.
import { $, $$, clamp, finePointer, lerp, onScroll, reducedMotion, scrollVelocity } from './lib';

// ---------- Revelações ao rolar ----------

export function initReveals(root: ParentNode = document) {
  const targets = $$('[data-reveal], .split, .rule', root).filter(el => !el.closest('[data-reveal-manual]'));
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.1 });
  targets.forEach(el => observer.observe(el));
}

// ---------- Cursor em forma de marca de registro ----------

export function initCursor() {
  if (!finePointer() || reducedMotion()) return;
  const ring = $('.cursor-ring');
  const dot = $('.cursor-dot');
  const tag = $('.cursor-tag');
  if (!ring || !dot || !tag) return;

  let x = -100, y = -100, rx = -100, ry = -100;
  let running = false;
  let shown = false;

  const loop = () => {
    rx = lerp(rx, x, 0.2);
    ry = lerp(ry, y, 0.2);
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    tag.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    if (Math.abs(rx - x) + Math.abs(ry - y) > 0.1) requestAnimationFrame(loop);
    else running = false;
  };

  addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    x = event.clientX;
    y = event.clientY;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (!shown) {
      shown = true;
      rx = x; ry = y;
      document.documentElement.classList.add('has-cursor');
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    shown = false;
    document.documentElement.classList.remove('has-cursor');
  });

  const setState = (target: Element | null) => {
    const labelled = target?.closest<HTMLElement>('[data-cursor]');
    const mode = labelled?.dataset.cursor ?? '';
    const typing = target?.closest('input:not([type="range"]):not([type="radio"]), textarea, select, iframe');
    const link = target?.closest('a, button, summary, label, [role="button"], input[type="range"]');

    ring.classList.toggle('is-off', Boolean(typing) || mode === 'hide');
    dot.classList.toggle('is-off', Boolean(typing) || mode === 'hide');
    const label = mode && mode !== 'hide' ? labelled?.dataset.cursorLabel ?? '' : '';
    tag.textContent = label;
    tag.classList.toggle('is-on', Boolean(label));
    ring.classList.toggle('is-tag', Boolean(label));
    ring.classList.toggle('is-link', !label && !typing && Boolean(link));
  };

  document.addEventListener('pointerover', event => setState(event.target as Element), { passive: true });
  document.addEventListener('pointerdown', () => ring.classList.add('is-press'), { passive: true });
  document.addEventListener('pointerup', () => ring.classList.remove('is-press'), { passive: true });
  // Ao entrar num iframe (mapa) o documento deixa de receber o mouse.
  $$('iframe').forEach(frame => frame.addEventListener('pointerenter', () => setState(frame)));
}

// ---------- Cabeçalho: vidro ao rolar, some ao descer, volta ao subir ----------

export function initHeader() {
  const header = $('.site-header');
  const progress = $('.read-progress');
  let hiddenAt = 0;

  onScroll(({ y, delta, height, viewport }) => {
    if (progress) progress.style.setProperty('--p', String(clamp(y / Math.max(1, height - viewport))));
    if (!header) return;
    header.classList.toggle('is-scrolled', y > 24);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    const focused = header.contains(document.activeElement);
    if (delta > 6 && y > 420 && !menuOpen && !focused) {
      header.classList.add('is-hidden');
      hiddenAt = y;
    } else if (delta < -6 || y < 420 || Math.abs(y - hiddenAt) > 900) {
      header.classList.remove('is-hidden');
    }
    document.documentElement.classList.toggle('header-hidden', header.classList.contains('is-hidden'));
  });

  header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // Destaca no menu a seção visível.
  const links = $$<HTMLAnchorElement>('.nav-link[href*="#"]');
  const sections = links
    .map(link => document.getElementById(link.hash.slice(1)))
    .filter((section): section is HTMLElement => Boolean(section));
  if (!sections.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.toggle('is-active', link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(section => observer.observe(section));
}

// ---------- Botões magnéticos ----------

export function initMagnetic(root: ParentNode = document) {
  if (!finePointer() || reducedMotion()) return;
  $$('[data-magnetic]', root).forEach(element => {
    const strength = Number(element.dataset.magnetic || 0.3);
    let rect: DOMRect | null = null;
    element.addEventListener('pointerenter', () => { rect = element.getBoundingClientRect(); });
    element.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      rect ??= element.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      element.style.setProperty('--mx', `${(dx * strength).toFixed(1)}px`);
      element.style.setProperty('--my', `${(dy * strength).toFixed(1)}px`);
    });
    element.addEventListener('pointerleave', () => {
      rect = null;
      element.style.setProperty('--mx', '0px');
      element.style.setProperty('--my', '0px');
    });
  });
}

// ---------- Parallax simples por atributo data-parallax="velocidade" ----------

export function initParallax(root: ParentNode = document) {
  if (reducedMotion()) return;
  const items = $$('[data-parallax]', root).map(element => ({ element, speed: Number(element.dataset.parallax || 0.1), visible: false }));
  if (!items.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const item = items.find(candidate => candidate.element === entry.target);
      if (item) item.visible = entry.isIntersecting;
    });
  }, { rootMargin: '20% 0px' });
  items.forEach(item => observer.observe(item.element));

  onScroll(({ viewport }) => {
    for (const item of items) {
      if (!item.visible) continue;
      const rect = item.element.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - viewport / 2) * -item.speed;
      item.element.style.setProperty('--py', `${offset.toFixed(1)}px`);
    }
  });
}

// ---------- Letreiros: aceleram e invertem conforme a rolagem ----------

export function initMarquees(root: ParentNode = document) {
  if (reducedMotion()) return;
  const marquees = $$('[data-marquee]', root);
  if (!marquees.length) return;
  let direction = 1;
  let rate = 1;
  let frame = 0;
  // Folga para tocar ao contrário (playbackRate negativo) sem chegar ao início.
  marquees.forEach(marquee => marquee.getAnimations({ subtree: true }).forEach(animation => {
    const duration = Number(animation.effect?.getComputedTiming().duration) || 40000;
    animation.currentTime = duration * 400;
  }));

  const update = () => {
    const velocity = scrollVelocity();
    if (Math.abs(velocity) > 0.05) direction = velocity > 0 ? 1 : -1;
    const target = direction * (1 + Math.min(Math.abs(velocity) * 3.2, 6));
    rate = lerp(rate, target, 0.08);
    marquees.forEach(marquee => {
      const factor = Number(marquee.dataset.marquee || 1);
      marquee.getAnimations({ subtree: true }).forEach(animation => { animation.playbackRate = rate * factor; });
      marquee.style.setProperty('--skew', `${clamp(velocity * -2.2, -8, 8).toFixed(2)}deg`);
    });
    if (Math.abs(rate - target) > 0.01 || Math.abs(velocity) > 0.01) frame = requestAnimationFrame(update);
    else frame = 0;
  };

  onScroll(() => { if (!frame) frame = requestAnimationFrame(update); }, false);
}
