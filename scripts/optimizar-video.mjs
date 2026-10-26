/**
 * Optimiza para web los clips crudos de Higgsfield.
 *
 *   video-fuente/*.mp4   ->   public/video/*.mp4 y *.webm
 *
 * Uso: pnpm video
 *
 * Lo que hace y por que:
 *
 * - Quita el audio. Los mp4 de MiniMax traen una pista aac vacia que no sirve
 *   de nada y el video es de fondo.
 * - Baja de 2560 a 1280 de ancho. El video vive detras de un velo negro al
 *   60%, asi que el detalle no se aprecia, y el publico son pacientes en
 *   Cucuta con conexiones variables.
 * - Fuerza un keyframe cada 6 cuadros, o sea cada 0.25s a 24fps. Ojo con la
 *   razon: lo que de verdad permite scrubbear es cargar el clip como Blob, que
 *   es siempre seekable, y eso lo hace MundoScroll.astro. El GOP corto importa
 *   en el telefono, donde el coste de cada busqueda escala con la distancia al
 *   keyframe anterior. Por eso 6 y no los 8 que sugiere la skill para
 *   escritorio: aqui un mismo archivo sirve a escritorio y a movil.
 * - unsharp leve, porque el video sale mas blando que las imagenes fijas.
 * - mp4 con faststart, por higiene; con carga por Blob no cambia nada.
 *
 * Sobre el webm: con un GOP tan corto, VP9 pierde su ventaja habitual, porque
 * depende de grupos largos y alt-ref frames. A igualdad de peso con H.264 no
 * aporta nada decisivo, pero se genera igual por compatibilidad y porque en
 * conexiones lentas cada kilobyte cuenta. Ver landing/README.md.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

import ffmpeg from "ffmpeg-static";

const ENTRADA = "video-fuente";
const SALIDA = "public/video";

const ANCHO = 1280;
const GOP = 6;

/*
  Por que no subimos a resolucion nativa y crf 20, que es lo que pide la skill
  scroll-world: su motor descarga cada clip entero como Blob antes de poder
  reproducirlo, sin streaming progresivo. Cada megabyte se vuelve tiempo hasta
  el primer fotograma. La skill asume banda ancha de escritorio; aqui el
  publico son pacientes en Cucuta con conexiones variables, y ademas el video
  va detras de un velo negro al 60% que se come el detalle fino.
*/
const comunes = [
  "-an",
  "-vf",
  `scale=${ANCHO}:-2,unsharp=5:5:0.8:5:5:0.0`,
  "-pix_fmt",
  "yuv420p",
];

const mp4 = [
  ...comunes,
  "-c:v", "libx264",
  "-profile:v", "high",
  "-crf", "26",
  "-preset", "slow",
  "-g", String(GOP),
  "-keyint_min", String(GOP),
  "-sc_threshold", "0",
  "-movflags", "+faststart",
];

const webm = [
  ...comunes,
  "-c:v", "libvpx-vp9",
  "-crf", "38",
  "-b:v", "0",
  "-g", String(GOP),
  "-keyint_min", String(GOP),
  "-row-mt", "1",
  "-deadline", "good",
  "-cpu-used", "2",
];

const mb = (ruta) => (statSync(ruta).size / 1048576).toFixed(2);

mkdirSync(SALIDA, { recursive: true });

const fuentes = readdirSync(ENTRADA)
  .filter((f) => f.endsWith(".mp4"))
  .sort();

if (fuentes.length === 0) {
  console.error(`No hay .mp4 en ${ENTRADA}/`);
  process.exit(1);
}

for (const archivo of fuentes) {
  const origen = join(ENTRADA, archivo);
  const nombre = basename(archivo, ".mp4");

  for (const [extension, opciones] of [
    ["mp4", mp4],
    ["webm", webm],
  ]) {
    const destino = join(SALIDA, `${nombre}.${extension}`);
    execFileSync(ffmpeg, ["-y", "-v", "error", "-i", origen, ...opciones, destino], {
      stdio: "inherit",
    });
    console.log(`${origen} (${mb(origen)} MB)  ->  ${destino} (${mb(destino)} MB)`);
  }
}
