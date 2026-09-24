// Menu em tela cheia usando <dialog> (foco preso, Esc fecha, fundo inerte).
import { $, $$, reducedMotion } from './lib';

export function initMenu() {
  const dialog = $<HTMLDialogElement>('#site-menu');
  const opener = $<HTMLButtonElement>('[data-menu-open]');
  if (!dialog || !opener || typeof dialog.showModal !== 'function') return;
  const root = document.documentElement;
  let closing = 0;

  const open = () => {
    clearTimeout(closing);
    dialog.showModal();
    root.classList.add('menu-open');
    opener.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is-open')));
  };

  const close = (afterClose?: () => void) => {
    dialog.classList.remove('is-open');
    opener.setAttribute('aria-expanded', 'false');
    root.classList.remove('menu-open');
    closing = window.setTimeout(() => {
      dialog.close();
      afterClose?.();
    }, reducedMotion() ? 0 : 560);
  };

  opener.addEventListener('click', open);
  $('[data-menu-close]', dialog)?.addEventListener('click', () => close());
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });

  $$<HTMLAnchorElement>('a', dialog).forEach(link => {
    link.addEventListener('click', event => {
      const url = new URL(link.href, location.href);
      const samePage = url.pathname === location.pathname && url.hash;
      if (!samePage) {
        close();
        return;
      }
      // Fecha e só depois rola até a seção (o dialog devolve a rolagem ao fechar).
      event.preventDefault();
      close(() => {
        document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
        history.pushState(null, '', url.hash);
      });
    });
  });

  matchMedia('(min-width: 1024px)').addEventListener('change', event => {
    if (event.matches && dialog.open) close();
  });
}
