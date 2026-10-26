// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages sirve este proyecto en
  // https://michaeldevelopment.github.io/landing-scia-lab/
  // Con `base` puesto, TODO enlace interno tiene que llevar ese prefijo. En el
  // codigo eso se resuelve con la funcion `ruta()` de src/datos.ts: no escribas
  // rutas absolutas a mano.
  site: 'https://michaeldevelopment.github.io',
  base: '/landing-scia-lab',

  vite: {
    plugins: [tailwindcss()]
  }
});