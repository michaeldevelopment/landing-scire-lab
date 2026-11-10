// GitHub Pages sirve este repo desde "Deploy from a branch" -> main -> /root,
// o sea que los archivos construidos tienen que estar en la raiz del repo.
// Astro no puede construir ahi directamente porque vacia su outDir, lo que
// borraria src/ y el resto del codigo: construye en dist/ y esto lo copia.
import { cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const dist = fileURLToPath(new URL('../dist', import.meta.url));

if (!existsSync(dist)) {
  throw new Error('No existe dist/. Corre "pnpm build" antes de publicar.');
}

// Los nombres dentro de _astro llevan hash: sin borrarla primero, la raiz
// acumula una copia de cada version publicada.
rmSync(new URL('../_astro', import.meta.url), { recursive: true, force: true });
cpSync(dist, raiz, { recursive: true });

console.log('Sitio copiado a la raiz. Ahora: git add -A, commit y push a main.');
