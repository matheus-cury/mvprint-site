// Ponto de entrada único: um só arquivo JS para o site inteiro.
import { initCursor, initHeader, initImageFades, initMagnetic, initMarquees, initParallax, initReveals } from './core';
import { initContact } from './contact';
import { initHero } from './hero';
import { initMenu } from './menu';
import { initPortfolio } from './portfolio';
import {
  initBeforeAfter, initCounters, initFloatingWhatsApp, initFooterWordmark,
  initHScroll, initQuotes, initServices,
} from './sections';

declare global {
  interface Window { __mv?: boolean }
}

window.__mv = true;

// Cada módulo roda isolado: um erro inesperado num deles não desliga os outros.
const modules = [
  initHero, initHScroll, initReveals, initImageFades, initHeader, initMenu, initCursor,
  initMagnetic, initParallax, initMarquees, initServices, initBeforeAfter, initQuotes,
  initCounters, initContact, initPortfolio, initFloatingWhatsApp, initFooterWordmark,
];
for (const init of modules) {
  try {
    init();
  } catch (error) {
    console.error(`[mvprint] ${init.name} falhou:`, error);
  }
}
