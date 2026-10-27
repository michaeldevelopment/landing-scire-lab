/**
 * Datos de Scire Clinical Diagnosis.
 *
 * Aqui solo entra lo que el cliente tiene publicado o confirmado. Lo que no
 * esta confirmado (precios, tiempos de entrega, horario, cobertura del
 * domiciliario, validez judicial, convenios, certificaciones) NO aparece en la
 * pagina ni se rellena con un valor plausible: la frase se reescribe para que
 * no haga la afirmacion. La lista viva esta en memoria/preguntas-abiertas.md.
 */

/**
 * Prefija una ruta interna con el `base` del sitio.
 *
 * Hace falta porque GitHub Pages publica el proyecto en un subdirectorio
 * (/landing-scire-lab/), no en la raiz del dominio. Una ruta absoluta escrita a
 * mano como "/video/adn-1.mp4" apuntaria fuera del sitio y daria 404.
 *
 * Usala para TODO lo interno: paginas, favicon, video, cualquier cosa de
 * public/. No aplica a enlaces externos ni a los assets que importa Astro
 * (esos ya salen con el prefijo puesto).
 *
 *   ruta("privacidad")       ->  /landing-scire-lab/privacidad
 *   ruta("/video/adn-1.mp4") ->  /landing-scire-lab/video/adn-1.mp4
 */
export function ruta(camino = "") {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${camino.replace(/^\//, "")}`;
}

export const sede = {
  direccion: "Av 0A #21-27, local 102",
  barrio: "Barrio Blanco",
  ciudad: "Cúcuta",
  departamento: "Norte de Santander",
  pais: "Colombia",
};

export const contacto = {
  whatsapp: "573043983662",
  whatsappVisible: "304 398 3662",
  correo: "gerencia@sciredx.com",
  instagram: "https://www.instagram.com/scire_clinicaldiagnosis/",
  instagramVisible: "@scire_clinicaldiagnosis",
};

/*
  Apunta al portal demo publicado, no al sistema interno real del laboratorio.

  El portal real del cliente es Bax, en
  http://sciredx.sytes.net:8081/bax/principal/principal.php
  Antes de publicar sobre el dominio real hay que decidir cual de los dos va
  aqui. Ver memoria/sistema-interno-y-portal-de-resultados.md.
*/
export const portalResultados =
  "https://michaeldevelopment.github.io/app-scire-lab/";

export function enlaceWhatsapp(mensaje: string) {
  return `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

export const ctaPrincipal = {
  texto: "Agendar la toma de muestra",
  href: enlaceWhatsapp("Hola. Quiero agendar una toma de muestra."),
};

export const marca = {
  nombre: "Scire Clinical Diagnosis",
  corto: "Scire",
};
