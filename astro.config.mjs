// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://mvprint.com.br',
  // Preserve the existing whitespace between inline elements after Astro 7.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()]
  }
});
