// Interações das seções da home.
import { $, $$, clamp, easeInOutCubic, easeOutExpo, finePointer, lerp, onScroll, reducedMotion, tween, watchVisibility } from './lib';

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

    // No toque, rolar a página por cima da foto não mexe na divisória: o arraste
    // só começa depois de um movimento horizontal claro.
    let pending: { id: number; x: number; y: number } | null = null;
    const startDrag = (event: PointerEvent) => {
      interacted = true;
      dragging = true;
      root.classList.add('is-dragging');
      if (event.pointerType !== 'mouse') root.setPointerCapture(event.pointerId);
      fromEvent(event);
    };
    root.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') startDrag(event);
      else pending = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    root.addEventListener('pointermove', event => {
      if (pending && event.pointerId === pending.id) {
        const dx = Math.abs(event.clientX - pending.x);
        const dy = Math.abs(event.clientY - pending.y);
        if (dx > 8 && dx > dy) { pending = null; startDrag(event); }
        else if (dy > 8) pending = null;
        return;
      }
      // No mouse, a divisória acompanha o cursor; no toque, só arrastando.
      if (dragging || (event.pointerType === 'mouse' && finePointer())) {
        interacted = true;
        fromEvent(event);
      }
    });
    const stop = () => { pending = null; dragging = false; root.classList.remove('is-dragging'); };
    root.addEventListener('pointerup', event => {
      if (pending && event.pointerId === pending.id) { interacted = true; fromEvent(event); }
      stop();
    });
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
  // Só a avaliação ativa fica acessível; as outras aguardam a vez.
  quotes.forEach((quote, i) => {
    if (i === index) return;
    quote.inert = true;
    quote.setAttribute('aria-hidden', 'true');
  });

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
    previous.inert = true;
    previous.setAttribute('aria-hidden', 'true');
    index = (target + quotes.length) % quotes.length;
    const current = quotes[index];
    current.inert = false;
    current.removeAttribute('aria-hidden');
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
    schedule();
  });
  if (paused) {
    pauseButton?.setAttribute('aria-pressed', 'true');
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
    tx = ((event.clientX - rect.left) / rect.width - 0.5) * 34;
    ty = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
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
