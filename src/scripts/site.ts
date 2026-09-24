// Ponto de entrada único: um só arquivo JS para o site inteiro.
import { initHeader, initImageFades, initMarquees, initParallax, initReveals } from './core';
import { initContact } from './contact';
import { initHero } from './hero';
import { initMenu } from './menu';
import { initPortfolio } from './portfolio';
import {
  initBeforeAfter, initCounters, initFloatingWhatsApp,
  initQuotes,
} from './sections';

declare global {
  interface Window { __mv?: boolean }
}

window.__mv = true;

// Cada módulo roda isolado: um erro inesperado num deles não desliga os outros.
const modules = [
  initHero, initReveals, initImageFades, initHeader, initMenu,
  initParallax, initMarquees, initBeforeAfter, initQuotes,
  initCounters, initContact, initPortfolio, initFloatingWhatsApp,
];
for (const init of modules) {
  try {
    init();
  } catch (error) {
    console.error(`[mvprint] ${init.name} falhou:`, error);
  }
}
