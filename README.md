# Landing — Scire Clinical Diagnosis

Landing de conversión del laboratorio. Cubre el portafolio completo: análisis
clínico de rutina, biología molecular, genética y genómica, tamizaje prenatal,
huella del ADN y paternidad, y toma domiciliaria.

Separada del portal demo de `app/`: aquí el SEO sí es el punto, así que usa
Astro y genera HTML estático.

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # salida estática en dist/
pnpm video    # reoptimiza los clips de video-fuente/ a public/video/
```

Sin dependencias de runtime para el scroll: no hay GSAP ni Lenis. El motor de
scrub son unas 120 líneas dentro de `MundoScroll.astro`.

## Despliegue en GitHub Pages

Se publica en **https://michaeldevelopment.github.io/landing-scire-lab/** desde
la rama `main`. Cada push dispara `.github/workflows/deploy.yml`, que construye
con la acción oficial de Astro y publica el resultado.

**Un paso manual, una sola vez:** en el repositorio, *Settings → Pages →
Source*, elegir **GitHub Actions**. Sin eso el workflow construye pero no
publica.

### La trampa del `base`

El sitio no vive en la raíz del dominio sino en `/landing-scire-lab/`. Eso está
configurado en `astro.config.mjs` con `site` y `base`, y tiene una consecuencia
que es fácil olvidar:

> **Toda ruta interna tiene que llevar ese prefijo.** Una ruta escrita a mano
> como `/video/adn-1.mp4` apuntaría fuera del sitio y daría 404.

Para eso existe `ruta()` en `src/datos.ts`. Úsala para páginas, favicon, video
y cualquier cosa de `public/`:

```astro
<a href={ruta("privacidad")}>…</a>
<link rel="icon" href={ruta("favicon.svg")} />
```

No hace falta para enlaces externos ni para los assets que importa Astro
(`src/assets/`), que ya salen prefijados solos.

Si algún día el sitio pasa a un dominio propio, basta con quitar `base` y
`ruta()` devuelve rutas normales sin tocar los componentes.

### Lo que no se publica

`video-fuente/` sí está versionado (unos 23 MB de originales a 2K) porque es la
única copia de los renders: las URLs de Higgsfield caducan a las 24 o 48 horas.
Pero **no se despliega**, porque está fuera de `public/`. Lo que viaja al sitio
son los clips optimizados, unos 4.3 MB por formato.

## Por qué Astro 6 y no 7

Astro 7 exige Node >=22.23.4 y la máquina de desarrollo tiene 22.20.0. Astro
6.4.8 pide >=22.12.0 y cumple. Bajar de versión evitó tocar la instalación de
Node, que también afecta al portal de `app/`. Cuando se actualice Node, subir
Astro es un cambio aislado.

## Estructura

```
src/
  datos.ts                  contacto, sede y enlaces de WhatsApp
  layouts/Layout.astro      meta, fuentes, enlace de salto, revelados al scroll
  components/
    MundoScroll.astro       el scroll world y su motor de scrub
    RevelacionLema.astro    sección de lema, palabra por palabra
    Servicios.astro         las seis líneas del portafolio
    ...                     resto de secciones
  assets/adn/               los cuatro keyframes de la hélice
  assets/fotos/             las cinco fotos generadas con IA
scripts/optimizar-video.mjs el transcodificado para web
video-fuente/               los clips crudos de 2K, NO se publican
public/video/               los clips optimizados, mp4 y webm
```

## Video: de Higgsfield a la web

Los clips crudos de Higgsfield salen a 2560x1440, con una pista de audio vacía
y keyframes espaciados. Así no sirven: pesan demasiado y **no se pueden
scrubbear**. El paso obligatorio es:

```bash
pnpm video     # video-fuente/*.mp4  ->  public/video/*.mp4 y *.webm
```

El script está en `scripts/optimizar-video.mjs` y usa `ffmpeg-static`, una
dependencia del proyecto: no hace falta instalar ffmpeg en el sistema.

Qué hace, y por qué cada cosa:

| Ajuste | Razón |
|---|---|
| Quita el audio | MiniMax adjunta una pista aac vacía y el video es de fondo |
| Baja a 1280 de ancho | Va detrás de un velo negro al 60%; el detalle no se aprecia |
| Keyframe cada 6 cuadros | Abarata cada búsqueda en el teléfono, donde el coste de un seek escala con la distancia al keyframe anterior. Son 6 y no los 8 que sugiere la skill porque un mismo archivo sirve a escritorio y a móvil |
| `unsharp` leve | El video sale más blando que las imágenes fijas |
| `+faststart` en el mp4 | Higiene; con carga por Blob no cambia nada |
| mp4 y webm | mp4 por compatibilidad, webm porque pesa algo menos |

Resultado: de 4 a 5 MB por clip a entre 1.2 y 1.8 MB en cada formato, unos
4.3 MB por formato para los tres.

**Ojo con el keyframe denso: no es lo que hace scrubbeable el video.** Eso lo
hace la carga por Blob. Un host que no sirva rangos HTTP congela el video por
muchos keyframes que tenga.

**Por qué no subimos a resolución nativa y crf 20**, que es lo que pide el Paso
6 de la skill: su propio motor descarga cada clip entero como Blob antes de
poder reproducirlo, sin streaming progresivo. Cada megabyte se vuelve tiempo
hasta el primer fotograma. La skill asume banda ancha de escritorio; aquí el
público son pacientes en Cúcuta con conexiones variables. Medido sobre el clip
más pesado: crf 20 lo deja en 3.64 MB y crf 26 en 1.71 MB.

**Sobre el webm.** Normalmente VP9 gana por bastante a H.264, pero aquí no:
con un GOP de 6 cuadros, VP9 pierde su ventaja porque depende de grupos largos
y de alt-ref frames. Medido sobre estos clips, los dos formatos quedan casi
iguales. Se generan ambos de todos modos, pero no esperes el ahorro habitual
del webm.

Los originales viven en `video-fuente/`, **fuera de `public/`** para que no se
publiquen. `public/video/` contiene solo las versiones optimizadas.

## El scroll world

Funcionando. Cada una de las tres paradas tiene su propio clip y el scroll
arrastra su `currentTime`. **No hace falta concatenar nada:** el crossfade entre
escenas resuelve las costuras.

La mecánica está **portada** de `references/scrub-engine.js` de la skill
`scroll-world`, no montada. El motor original construye su propia página entera
(barra superior, nav, capa de copy numerada, rail, partículas) y eso habría
costado el `h1` del héroe, su degradado, los iconos y el botón de WhatsApp. Lo
que vale de ese motor es la mecánica, y es lo que está en `MundoScroll.astro`:

1. **Carga por Blob.** La razón principal del cambio. Un Blob siempre es
   seekable. Servido por URL normal, muchos hosts estáticos no responden
   peticiones de rango HTTP, y entonces `video.seekable` queda en `[0,0]` y
   toda búsqueda se recorta al fotograma 0: el video se ve congelado. La
   implementación anterior, con GSAP, tenía exactamente ese defecto.
2. **Coalescencia de seeks.** Nunca se pide un `currentTime` nuevo mientras el
   decodificador sigue buscando. Sin esto, un desliz rápido en el teléfono
   encola búsquedas y congela el clip.
3. **Cebado de iOS.** Safari no pinta un fotograma buscado en un video muteado
   que nunca se reprodujo; se ceba con play/pause al primer gesto.
4. **El keyframe es el póster** hasta que el clip pinta su primer fotograma.
   Como cada keyframe es el fotograma inicial de su clip, el relevo no se nota.
5. **Crossfade en las costuras**, que cubre la deriva del lado de salida.
6. **El texto está fijado y solo cambia de opacidad.** Vive dentro de la capa
   pegajosa, no en el flujo. Los `[data-parada]` de abajo son espaciadores
   vacíos: existen solo para dar una pantalla de scroll por parada.

   **Esto no es un detalle de implementación, es la única forma de que el texto
   aparezca y se desvanezca de verdad.** Cuando el texto scrollea, para que no
   quede un instante sin nada en pantalla la curva de opacidad tiene que ser
   tan ancha que el texto acaba viéndose casi siempre. Las dos cosas se
   contradicen. Fijándolo, la opacidad se despega de la geometría.

   La curva se calcula sobre el avance dentro del tramo de cada parada, con
   `MESETA` y `CAIDA` al principio del script. Que el cero caiga más allá del
   final del tramo es deliberado: hace que el texto saliente y el entrante se
   crucen a media opacidad. El héroe es el único caso aparte (`HEROE_PLENO` y
   `HEROE_FIN`), porque tiene que estar legible al cargar la página en vez de
   aparecer.

Con `prefers-reduced-motion` no se descarga ningún clip: los keyframes se quedan
y solo se funden entre sí, y el texto queda fijo y opaco, sin desplazamiento.

### Lo que no se pudo verificar

El scrub se validó en navegador: los tres clips cargan como Blob,
`seekable.end(0)` devuelve la duración completa en vez de `[0,0]`,
`currentTime` sigue al scroll, el relevo de póster a video ocurre, las costuras
mantienen la composición y la consola queda limpia.

**La fluidez real no.** En el entorno de prueba la ventana estaba ocluida y
Chrome throttleó `requestAnimationFrame` a 1.1 fps, así que la interpolación
converge despacio y no se puede juzgar el deslizamiento. Hace falta probarlo en
una ventana en primer plano y, sobre todo, **en un teléfono real**: la
coalescencia de seeks y el cebado de iOS son justo lo que no se puede comprobar
desde aquí.

## Qué dice la página y qué no

Lo que aparece sale del portafolio publicado por el cliente y de `memoria/`.
**Lo que no está confirmado no aparece, y tampoco se rellena con un valor
plausible:** la frase se reescribe para que no haga la afirmación.

Hoy están fuera de la página, y siguen pendientes en
`memoria/preguntas-abiertas.md`:

- Precios y tiempos de entrega. El copy dice que se confirman al agendar.
- Horario de atención y los teléfonos fijos.
- Cobertura y recargo de la toma domiciliaria.
- Si las pruebas de paternidad tienen validez judicial con cadena de custodia.
- La alianza con el distribuidor de un laboratorio genético alemán, hasta
  confirmar vigencia y grafía. Es el respaldo más fuerte de la línea genética.
- Convenios con EPS, certificaciones, acreditaciones y testimonios.

Si alguien agrega uno de estos datos, que venga del cliente, no de una
estimación razonable.

## Lo que no es real todavía

- **Las cinco fotos son generadas con IA.** No son la sede de Scire ni su
  personal. Antes se mostraban con un aviso en el pie de figura; el cliente
  pidió quitarlo. Para la demo sirven; antes de publicar sobre el dominio real,
  reemplazarlas por fotografía propia o decidir conscientemente lo contrario.
- **Los keyframes de ADN también son generados.** Son ilustración, y se leen
  como tal.
- **El favicon es provisional.** Falta el logo en vectorial.
- **`/privacidad` es un borrador.** El texto legal lo redacta el cliente o su
  asesor.

## Reglas que esta landing respeta y conviene no romper

- Rojo `#AC2328` y azul `#506285` nunca uno sobre otro: su contraste es 1.13.
- Sin cursivas en la interfaz. La itálica vive dentro del logo.
- Fondos planos. El único degradado es el del texto del titular.
- El titular del héroe va sobre un velo plano `bg-black/60`. Sin él, el
  contraste depende del fotograma y deja de ser verificable.
- Movimiento con `IntersectionObserver`, nunca con un listener de scroll sin
  throttle. `prefers-reduced-motion` cambia el keyframe de golpe, sin animación.
- Vocabulario del cliente: muestra, toma de muestra, toma domiciliaria,
  domiciliario, cava, procesar, remitir, resultado, sede. Ver `CONTEXTO.md` §5.

Ver `docs/LINEA-GRAFICA.md` para el resto.
