// Página de portfólio: filtros por categoria (com #hash) e ampliação das fotos.
import { $, $$, reducedMotion } from './lib';

export function initPortfolio() {
  const gallery = $('#portfolio-gallery');
  if (!gallery) return;

  const filterButtons = $$<HTMLButtonElement>('.filter-btn');
  const sections = $$('.category-section');
  const status = $('#portfolio-status');
  const items = $$<HTMLAnchorElement>('.portfolio-item');
  const lightbox = $<HTMLDialogElement>('#lightbox');
  const image = $<HTMLImageElement>('#lightbox-img');
  const title = $('#lightbox-title');
  const counter = $('#lightbox-counter');
  const bar = $('#lightbox-bar');
  const closeButton = $<HTMLButtonElement>('#lightbox-close');
  const previousButton = $<HTMLButtonElement>('#lightbox-prev');
  const nextButton = $<HTMLButtonElement>('#lightbox-next');

  let visible = items;
  let current = 0;
  let opener: HTMLAnchorElement | null = null;
  let previousOverflow = '';

  // ---------- Filtros ----------

  const animateIn = (list: HTMLElement[]) => {
    if (reducedMotion()) return;
    const viewport = innerHeight;
    list.slice(0, 40).forEach((item, index) => {
      if (item.getBoundingClientRect().top > viewport * 1.2) return;
      item.style.setProperty('--delay', `${Math.min(index, 16) * 0.035}s`);
      item.classList.remove('is-enter');
      void item.offsetWidth;
      item.classList.add('is-enter');
    });
  };

  // Filtro aceita um grupo (chip) ou uma categoria (links da home, ex.: #tapumes).
  const groupButton = (id: string) => filterButtons.find(button => id !== 'all' && button.dataset.filter === id);
  const categorySection = (slug: string) => sections.find(section => section.dataset.category === slug);

  const applyFilter = (requested: string, animate = false) => {
    const group = groupButton(requested);
    const category = group ? undefined : categorySection(requested);
    const active = group?.dataset.filter ?? category?.dataset.group ?? 'all';
    if (lightbox?.open) lightbox.close();
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === active)));
    sections.forEach(section => {
      section.hidden = group ? section.dataset.group !== requested : category ? section !== category : false;
    });
    const shown = new Set(sections.filter(section => !section.hidden).map(section => section.dataset.category));
    visible = items.filter(item => shown.has(item.dataset.category));
    if (status) {
      const label = group?.dataset.label ?? category?.dataset.label ?? 'Todas as categorias';
      status.textContent = `${label} · ${visible.length} fotos · Selecione uma imagem para ampliar.`;
    }
    // Mantém o chip ativo visível na faixa rolável.
    filterButtons.find(button => button.dataset.filter === active)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    if (animate) requestAnimationFrame(() => animateIn(visible));
  };

  const selectFilter = (filter: string) => {
    applyFilter(filter, true);
    const url = new URL(location.href);
    url.hash = filter === 'all' ? '' : filter;
    history.replaceState(null, '', url);
    // Se o visitante já desceu na galeria, volta ao começo da seleção.
    const top = gallery.getBoundingClientRect().top;
    if (top < 0) scrollTo({ top: scrollY + top - 170, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  filterButtons.forEach(button => button.addEventListener('click', () => selectFilter(button.dataset.filter ?? 'all')));
  // Só reage a #grupo, #categoria (ou # vazio): o link "Pular para o conteúdo" e outras
  // âncoras da página não mexem no filtro. Hash malformado não quebra nada.
  const hashFilter = () => {
    let hash = location.hash.slice(1);
    try { hash = decodeURIComponent(hash); } catch { return null; }
    if (!hash) return 'all';
    return groupButton(hash) || categorySection(hash) ? hash : null;
  };
  addEventListener('hashchange', () => {
    const filter = hashFilter();
    if (filter) applyFilter(filter, true);
  });
  // Mostra os filtros antes de aplicar, para o chip ativo poder rolar até a vista.
  $('#portfolio-filters')?.removeAttribute('hidden');
  applyFilter(hashFilter() ?? 'all');

  // ---------- Ampliação ----------

  if (!lightbox || !image || typeof lightbox.showModal !== 'function') return;

  const preload = (index: number) => {
    const item = visible[(index + visible.length) % visible.length];
    if (item?.dataset.fullImage) { const img = new Image(); img.src = item.dataset.fullImage; }
  };

  const show = (direction = 0) => {
    const item = visible[current];
    const thumbnail = item?.querySelector('img');
    if (!item || !thumbnail) return;
    const apply = () => {
      image.dataset.fallback = item.href;
      image.src = item.dataset.fullImage || item.href;
      image.alt = thumbnail.alt;
      if (title) title.textContent = item.dataset.title ?? 'Visualização do portfólio';
      if (counter) counter.textContent = `${current + 1} de ${visible.length}`;
      if (bar) {
        bar.style.setProperty('--w', `${100 / visible.length}%`);
        bar.style.setProperty('--x', `${current * 100}%`);
      }
      if (previousButton) previousButton.disabled = visible.length < 2;
      if (nextButton) nextButton.disabled = visible.length < 2;
      preload(current + 1);
      preload(current - 1);
    };
    if (!direction || reducedMotion()) { apply(); return; }
    image.style.setProperty('--dir', String(direction));
    image.classList.add('is-leaving');
    setTimeout(() => {
      image.classList.remove('is-leaving');
      image.classList.add('is-entering');
      apply();
      const reveal = () => requestAnimationFrame(() => requestAnimationFrame(() => image.classList.remove('is-entering')));
      if (image.complete) reveal();
      else image.addEventListener('load', reveal, { once: true });
    }, 180);
  };

  // Se o WebP falhar, a foto original continua disponível.
  image.addEventListener('error', () => {
    const fallback = image.dataset.fallback;
    if (fallback && !image.src.endsWith(fallback)) image.src = fallback;
    image.classList.remove('is-entering');
  });

  gallery.addEventListener('click', event => {
    const target = event.target as Element;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const item = target.closest<HTMLAnchorElement>('.portfolio-item');
    if (!item) return;
    const index = visible.indexOf(item);
    if (index < 0) return;
    event.preventDefault();
    current = index;
    opener = item;
    previousOverflow = document.body.style.overflow;
    show();
    lightbox.showModal();
    document.body.style.overflow = 'hidden';
    closeButton?.focus();
  });

  const move = (step: number) => {
    if (!lightbox.open || visible.length < 2) return;
    current = (current + step + visible.length) % visible.length;
    show(step);
  };

  closeButton?.addEventListener('click', () => lightbox.close());
  previousButton?.addEventListener('click', () => move(-1));
  nextButton?.addEventListener('click', () => move(1));
  lightbox.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    if (opener && !opener.closest<HTMLElement>('.category-section')?.hidden) opener.focus({ preventScroll: true });
  });
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox || event.target === $('#lightbox-figure')) lightbox.close();
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
    // Escape e a contenção de foco vêm do <dialog> modal nativo.
  });

  // Deslizar o dedo para trocar de foto.
  const stage = $('#lightbox-figure');
  let startX = 0, startY = 0, tracking = false;
  stage?.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') return; tracking = true; startX = event.clientX; startY = event.clientY; });
  stage?.addEventListener('pointerup', event => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(event.clientY - startY) * 1.2) move(dx < 0 ? 1 : -1);
  });
  stage?.addEventListener('pointercancel', () => { tracking = false; });
}
