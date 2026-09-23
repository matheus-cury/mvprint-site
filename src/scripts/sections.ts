// Interações das seções da home.
import { $, $$, clamp, easeInOutCubic, easeOutExpo, finePointer, lerp, onScroll, reducedMotion, tween, watchVisibility } from './lib';

// ---------- Serviços: foto que segue o cursor ----------

export function initServices() {
  const list = $('[data-services]');
  const float = $('.svc-float');
  if (!list || !float || !finePointer() || reducedMotion()) return;
  const images = $$('img', float);
  let x = 0, y = 0, cx = 0, cy = 0, rotation = 0;
  let active = -1;
  let hovering = false;
  let frame = 0;

  const loop = () => {
    cx = lerp(cx, x, 0.14);
    cy = lerp(cy, y, 0.14);
    rotation = lerp(rotation, clamp((x - cx) * 0.06, -9, 9), 0.12);
    const rect = float.getBoundingClientRect();
    float.style.transform = `translate3d(${(cx - rect.width / 2).toFixed(1)}px, ${(cy - rect.height / 2).toFixed(1)}px, 0) rotate(${rotation.toFixed(2)}deg)`;
    if (hovering || Math.abs(cx - x) + Math.abs(cy - y) > 0.5) frame = requestAnimationFrame(loop);
    else frame = 0;
  };

  list.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    x = event.clientX;
    y = event.clientY;
    if (!hovering) {
      hovering = true;
      cx = x; cy = y;
      float.classList.add('is-on');
    }
    const row = (event.target as Element).closest<HTMLElement>('.svc');
    const index = row ? Number(row.dataset.index) : -1;
    if (index !== active && index >= 0) {
      images[active]?.classList.remove('is-active');
      images[index]?.classList.add('is-active');
      active = index;
    }
    if (!frame) frame = requestAnimationFrame(loop);
  });
  list.addEventListener('pointerleave', () => {
    hovering = false;
    float.classList.remove('is-on');
  });
}

// ---------- Trabalhos: faixa horizontal presa durante a rolagem ----------

export function initHScroll() {
  const section = $('[data-hscroll]');
  const track = $('[data-hscroll-track]', section ?? document);
  const progress = $('[data-hscroll-progress]', section ?? document);
  if (!section || !track) return;
  const images = $$('.work-img', section);
  const desktop = matchMedia('(min-width: 900px)');
  let enabled = false;
  let distance = 0;

  const measure = () => {
    enabled = desktop.matches && !reducedMotion();
    section.classList.toggle('is-pinned', enabled);
    if (!enabled) {
      section.style.height = '';
      track.style.transform = '';
      images.forEach(image => image.style.removeProperty('--px'));
      return;
    }
    distance = Math.max(0, track.scrollWidth - innerWidth);
    section.style.height = `${distance + innerHeight}px`;
    update();
  };

  // Posição lida a cada quadro: continua certa mesmo se algo acima mudar de altura.
  const sectionTop = () => section.getBoundingClientRect().top + scrollY;

  const update = () => {
    if (!enabled) return;
    const p = clamp(-section.getBoundingClientRect().top / Math.max(1, distance));
    track.style.transform = `translate3d(${(-p * distance).toFixed(1)}px, 0, 0)`;
    progress?.style.setProperty('--p', p.toFixed(4));
    const center = innerWidth / 2;
    for (const image of images) {
      const rect = image.parentElement!.getBoundingClientRect();
      if (rect.right < -200 || rect.left > innerWidth + 200) continue;
      const offset = (rect.left + rect.width / 2 - center) * -0.09;
      image.style.setProperty('--px', `${offset.toFixed(1)}px`);
    }
  };

  onScroll(() => update());

  // Teclado: ao focar um card fora da faixa visível, rola até ele aparecer.
  track.addEventListener('focusin', event => {
    if (!enabled) return;
    const card = (event.target as Element).closest<HTMLElement>('.work, .work-end, .featured-intro');
    if (!card) return;
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const x = cardRect.left - trackRect.left;
    const target = clamp(x - innerWidth * 0.25, 0, distance);
    scrollTo({ top: sectionTop() + target, behavior: 'auto' });
  });
  desktop.addEventListener('change', measure);
  addEventListener('resize', measure);
  // Fontes e imagens mudam a largura da faixa: remede quando mudar.
  new ResizeObserver(measure).observe(track);
  measure();
}

// ---------- Antes e depois ----------

export function initBeforeAfter() {
  $$('[data-ba]').forEach(root => {
    const range = $<HTMLInputElement>('.ba-range', root);
    let position = 50;
    let dragging = false;
    let interacted = false;

    const set = (value: number) => {
      position = clamp(value, 0, 100);
      root.style.setProperty('--pos', `${position.toFixed(2)}%`);
      if (range) {
        range.value = String(Math.round(position));
        range.setAttribute('aria-valuetext', `${Math.round(position)}% mostrando a instalação`);
      }
    };
    const fromEvent = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      set(((event.clientX - rect.left) / rect.width) * 100);
    };

    root.addEventListener('pointerdown', event => {
      interacted = true;
      dragging = true;
      root.classList.add('is-dragging');
      if (event.pointerType !== 'mouse') root.setPointerCapture(event.pointerId);
      fromEvent(event);
    });
    root.addEventListener('pointermove', event => {
      // No mouse, a divisória acompanha o cursor; no toque, só arrastando.
      if (dragging || (event.pointerType === 'mouse' && finePointer())) {
        interacted = true;
        fromEvent(event);
      }
    });
    const stop = () => { dragging = false; root.classList.remove('is-dragging'); };
    root.addEventListener('pointerup', stop);
    root.addEventListener('pointercancel', stop);
    range?.addEventListener('input', () => { interacted = true; set(Number(range.value)); });

    set(50);
    // Dica de interação: a divisória "respira" uma vez quando aparece.
    if (!reducedMotion()) {
      const stopWatching = watchVisibility(root, visible => {
        if (!visible || interacted) return;
        stopWatching();
        const keys = [50, 22, 78, 50];
        let step = 0;
        const next = () => {
          if (interacted || step >= keys.length - 1) return;
          const from = keys[step];
          const to = keys[++step];
          tween(900, t => { if (!interacted) set(from + (to - from) * t); }, easeInOutCubic, next);
        };
        setTimeout(next, 500);
      }, '0px 0px -25% 0px');
    }
  });
}

// ---------- Avaliações: uma citação por vez ----------

export function initQuotes() {
  const root = $('[data-quotes]');
  if (!root) return;
  const quotes = $$('[data-quote]', root);
  const bar = $('[data-quote-bar]', root);
  const counter = $('[data-quote-index]', root);
  const status = $('[data-quote-status]', root);
  const pauseButton = $<HTMLButtonElement>('[data-quote-pause]', root);
  const HOLD = 7000;
  let index = 0;
  let paused = reducedMotion();
  let hovering = false;
  let focused = false;
  let visible = false;
  let timer = 0;

  const schedule = () => {
    clearTimeout(timer);
    bar?.classList.remove('is-running');
    if (paused || hovering || focused || !visible || document.hidden) return;
    if (bar) {
      bar.style.setProperty('--t', `${HOLD}ms`);
      void bar.getBoundingClientRect();
      bar.classList.add('is-running');
    }
    timer = window.setTimeout(() => go(index + 1, false), HOLD);
  };

  const go = (target: number, announce: boolean) => {
    const previous = quotes[index];
    previous.classList.remove('is-active');
    previous.hidden = true;
    index = (target + quotes.length) % quotes.length;
    const current = quotes[index];
    current.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => current.classList.add('is-active')));
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    if (announce && status) status.textContent = current.querySelector('blockquote')?.textContent?.trim() ?? '';
    schedule();
  };

  $('[data-quote-prev]', root)?.addEventListener('click', () => go(index - 1, true));
  $('[data-quote-next]', root)?.addEventListener('click', () => go(index + 1, true));
  pauseButton?.addEventListener('click', () => {
    paused = !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Retomar troca automática' : 'Pausar troca automática');
    schedule();
  });
  if (paused) {
    pauseButton?.setAttribute('aria-pressed', 'true');
    pauseButton?.setAttribute('aria-label', 'Retomar troca automática');
  }
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; schedule(); } });
  root.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovering = false; schedule(); } });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget as Node)) { focused = false; schedule(); }
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') go(index - 1, true);
    if (event.key === 'ArrowRight') go(index + 1, true);
  });

  // Deslizar o dedo troca a avaliação.
  const stage = $('.quotes-stage', root);
  let startX = 0;
  let startY = 0;
  stage?.addEventListener('pointerdown', event => { startX = event.clientX; startY = event.clientY; });
  stage?.addEventListener('pointerup', event => {
    const dx = event.clientX - startX;
    if (event.pointerType !== 'mouse' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(event.clientY - startY)) go(index + (dx < 0 ? 1 : -1), true);
  });

  watchVisibility(root, isVisible => { visible = isVisible; schedule(); });
  document.addEventListener('visibilitychange', schedule);
}

// ---------- Números que contam ao aparecer ----------

export function initCounters() {
  if (reducedMotion()) return;
  $$('[data-count]').forEach(element => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    element.textContent = '0';
    const stop = watchVisibility(element, visible => {
      if (!visible) return;
      stop();
      tween(2000, t => { element.textContent = Math.round(target * t).toLocaleString('pt-BR'); }, easeOutExpo);
    }, '0px 0px -12% 0px');
  });
}

// ---------- Botão flutuante do WhatsApp ----------

export function initFloatingWhatsApp() {
  const button = $('[data-wa-float]');
  if (!button) return;
  // Some perto do formulário de contato e do rodapé, que já têm o WhatsApp.
  const blockers = $$('#contato, [data-footer]');
  const covering = new Set<Element>();
  const update = (y: number) => button.classList.toggle('is-visible', y > innerHeight * 0.6 && covering.size === 0);
  blockers.forEach(element => watchVisibility(element, visible => {
    if (visible) covering.add(element);
    else covering.delete(element);
    update(scrollY);
  }, '0px 0px -35% 0px'));
  onScroll(({ y }) => update(y));
}

// ---------- Marca do rodapé: registro CMYK que segue o mouse ----------

export function initFooterWordmark() {
  const footer = $('[data-footer]');
  const reg = $('[data-reg-footer]');
  if (!footer || !reg || reducedMotion()) return;
  let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
  const loop = () => {
    x = lerp(x, tx, 0.1);
    y = lerp(y, ty, 0.1);
    reg.style.setProperty('--rx', `${x.toFixed(2)}px`);
    reg.style.setProperty('--ry', `${y.toFixed(2)}px`);
    frame = Math.abs(x - tx) + Math.abs(y - ty) > 0.05 ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => { if (!frame) frame = requestAnimationFrame(loop); };
  footer.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = footer.getBoundingClientRect();
    tx = ((event.clientX - rect.left) / rect.width - 0.5) * 40;
    ty = ((event.clientY - rect.top) / rect.height - 0.5) * 22;
    kick();
  });
  footer.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  // Sem mouse: a marca "acerta o registro" quando aparece.
  if (!finePointer()) {
    const stop = watchVisibility(reg, visible => {
      if (!visible) return;
      stop();
      x = 22; y = 10; tx = 0; ty = 0;
      kick();
    }, '0px 0px -20% 0px');
  }
}
