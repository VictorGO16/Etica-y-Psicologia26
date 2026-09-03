/* =========================================================
   Construye el sitio en la carpeta publicado/
   No necesita instalar dependencias: sólo Node >= 18.

   Qué hace:
   1. lee contenido.json
   2. reúne las sesiones declaradas y los HTML disponibles
   3. construye la sección Recursos desde contenido.json
   4. cualquier archivo declarado como recurso se puede descargar
   5. si el archivo es PDF, agrega además un visor integrado
   6. copia sesiones/ y recursos/ completos a publicado/
   ========================================================= */

import { readFile, writeFile, readdir, mkdir, rm, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const salida = path.join(raiz, 'publicado');

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* ---------- utilidades ---------- */

const escapar = (t) =>
  String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clave = (t) => String(t ?? '').normalize('NFC');

function fechaLegible(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
  if (!m) return String(iso);
  const [, a, mes, d] = m;
  return `${Number(d)} ${MESES[Number(mes) - 1]} ${a}`;
}

function leerNombre(archivo) {
  const base = archivo.replace(/\.html$/i, '');
  const m = /^\s*[SsCc]\s*0*(\d+)\s*[-–—:.]\s*(.+?)\s*$/.exec(base);
  if (m) return { numero: Number(m[1]), titulo: m[2] };
  return { numero: null, titulo: base.trim() };
}

function rutaWeb(...partes) {
  return partes
    .filter(Boolean)
    .flatMap((p) => String(p).split('/'))
    .map((p) => encodeURIComponent(p))
    .join('/');
}

function extension(archivo) {
  return path.extname(String(archivo || '')).slice(1).toLowerCase();
}

function etiquetaTipo(archivo) {
  const ext = extension(archivo);
  return ext ? ext.toUpperCase() : 'ARCHIVO';
}

function slug(t) {
  return String(t || 'recurso')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 54) || 'recurso';
}

function pesoLegible(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`.replace('.', ',');
}

async function listarHtml(carpeta) {
  if (!existsSync(carpeta)) return [];
  const entradas = await readdir(carpeta, { withFileTypes: true });
  return entradas
    .filter((e) => e.isFile() && /\.html$/i.test(e.name) && !e.name.startsWith('.'))
    .map((e) => e.name);
}

async function copiarCarpeta(origen, destino) {
  if (!existsSync(origen)) return 0;
  await mkdir(destino, { recursive: true });
  const entradas = await readdir(origen, { withFileTypes: true });
  let n = 0;
  for (const e of entradas) {
    if (e.name.startsWith('.') || e.name.toUpperCase() === 'LEEME.TXT') continue;
    const desde = path.join(origen, e.name);
    const hacia = path.join(destino, e.name);
    if (e.isDirectory()) {
      n += await copiarCarpeta(desde, hacia);
    } else {
      await copyFile(desde, hacia);
      n++;
    }
  }
  return n;
}

async function infoArchivo(carpeta, archivo) {
  const ruta = path.join(raiz, carpeta, archivo);
  try {
    const s = await stat(ruta);
    if (!s.isFile()) return { existe: false, bytes: 0 };
    return { existe: true, bytes: s.size };
  } catch {
    return { existe: false, bytes: 0 };
  }
}

function youtubeId(url) {
  try {
    const u = new URL(String(url));
    let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.replace(/^\//, '').split('/')[0];
    if (u.hostname.endsWith('youtube.com')) {
      id = u.searchParams.get('v') || '';
      if (!id && u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2] || '';
      if (!id && u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2] || '';
    }
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : '';
  } catch {
    return '';
  }
}

/* ---------- iconos ---------- */

const FLECHA =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<path d="M2 8h11M9 4l4 4-4 4"/></svg>';

const DESCARGA =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<path d="M8 2v8M5 7l3 3 3-3M3 13h10"/></svg>';

const CHEVRON =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<path d="M4 6l4 4 4-4"/></svg>';

/* ---------- sesiones ---------- */

async function reunirSesiones(metadatos) {
  const carpeta = 'sesiones';
  const archivos = await listarHtml(path.join(raiz, carpeta));
  const publicados = new Set(archivos.map(clave));

  const items = archivos.map((archivo) => {
    const meta = metadatos[clave(archivo)] || metadatos[archivo] || {};
    const leido = leerNombre(archivo);
    return {
      archivo,
      publicado: true,
      href: rutaWeb(carpeta, archivo),
      numero: meta.numero ?? leido.numero,
      titulo: meta.titulo || leido.titulo,
      resumen: meta.resumen || '',
      fecha: meta.fecha || ''
    };
  });

  for (const [nombre, meta] of Object.entries(metadatos)) {
    if (publicados.has(clave(nombre))) continue;
    const leido = leerNombre(nombre);
    items.push({
      archivo: nombre,
      publicado: false,
      href: '',
      numero: meta.numero ?? leido.numero,
      titulo: meta.titulo || leido.titulo,
      resumen: meta.resumen || '',
      fecha: meta.fecha || ''
    });
  }

  items.sort((a, b) => {
    if (a.numero != null && b.numero != null) return a.numero - b.numero;
    if (a.numero != null) return -1;
    if (b.numero != null) return 1;
    return a.titulo.localeCompare(b.titulo, 'es');
  });

  return items;
}

function pintarFilaSesion(item, i) {
  const numero = item.numero != null ? String(item.numero).padStart(2, '0') : String(i + 1).padStart(2, '0');
  const fecha = fechaLegible(item.fecha);

  const interior = `            <span class="fila__numero" aria-hidden="true">${numero}</span>
            <div class="fila__cuerpo">
              <h3 class="fila__titulo">${escapar(item.titulo)}</h3>
              ${item.resumen ? `<p class="fila__resumen">${escapar(item.resumen)}</p>` : ''}
            </div>
            <div class="fila__meta">
              ${fecha ? `<span class="fila__fecha">${escapar(fecha)}</span>` : ''}
              ${
                item.publicado
                  ? `<span class="fila__accion">Abrir ${FLECHA}</span>`
                  : `<span class="fila__accion fila__accion--espera">Por publicar</span>`
              }
            </div>`;

  const bloque = item.publicado
    ? `          <a class="fila__enlace" href="${escapar(item.href)}" target="_blank" rel="noopener">\n${interior}\n          </a>`
    : `          <div class="fila__enlace">\n${interior}\n          </div>`;

  return `        <li class="fila${item.publicado ? '' : ' fila--espera'} aparece" data-orden="${i}">
${bloque}
          <div class="fila__regla" aria-hidden="true"><span></span></div>
        </li>`;
}

function pintarSesiones(config, items) {
  const publicadas = items.filter((x) => x.publicado).length;
  const conteo = publicadas === 1 ? '1 publicada' : `${publicadas} publicadas`;

  const cuerpo = items.length
    ? `      <ul class="listado">\n${items.map(pintarFilaSesion).join('\n')}\n      </ul>`
    : `      <div class="vacio">
        <p>${escapar(config.vacio || 'Todavía no hay sesiones publicadas.')}</p>
        <p>Deja un archivo <code>.html</code> en <code>sesiones/</code> y agrega sus datos en <code>contenido.json</code>.</p>
      </div>`;

  return `  <section class="seccion" id="sesiones">
    <div class="contenedor">
      <div class="seccion__encabezado">
        <h2 class="seccion__titulo">${escapar(config.titulo || 'Sesiones')}</h2>
        ${items.length ? `<span class="seccion__conteo">${conteo}</span>` : ''}
      </div>
      ${config.nota ? `<p class="seccion__nota">${escapar(config.nota)}</p>` : ''}
${cuerpo}
    </div>
  </section>`;
}

/* ---------- recursos ---------- */

async function prepararArchivos(items, subcarpeta) {
  return Promise.all((items || []).map(async (item) => {
    const info = await infoArchivo(path.join('recursos', subcarpeta), item.archivo);
    return {
      ...item,
      existe: info.existe,
      bytes: info.bytes,
      ext: extension(item.archivo),
      tipo: etiquetaTipo(item.archivo),
      href: rutaWeb('recursos', subcarpeta, item.archivo)
    };
  }));
}

function metaArchivo(item) {
  const partes = [item.tipo];
  if (item.existe && item.bytes) partes.push(pesoLegible(item.bytes));
  return partes.join(' · ');
}

function botonDescarga(item, texto = 'Descargar') {
  if (!item.existe) {
    return `<span class="accion accion--inhabilitada" aria-disabled="true">Archivo no disponible</span>`;
  }
  return `<a class="accion accion--secundaria" href="${escapar(item.href)}" download="${escapar(item.archivo)}">${escapar(texto)} ${DESCARGA}</a>`;
}

function bloqueVisorPdf(item, id) {
  if (!item.existe || item.ext !== 'pdf') return '';
  return `        <button class="accion accion--primaria js-desplegar" type="button" aria-expanded="false" aria-controls="${escapar(id)}" data-abre="${escapar(id)}" data-texto-abierto="Cerrar PDF" data-texto-cerrado="Ver PDF">
          <span class="js-desplegar-texto">Ver PDF</span> ${CHEVRON}
        </button>`;
}

function panelPdf(item, id, titulo) {
  if (!item.existe || item.ext !== 'pdf') return '';
  return `      <div class="recurso__panel" id="${escapar(id)}" hidden>
        <div class="visor visor--pdf">
          <iframe title="PDF: ${escapar(titulo)}" loading="lazy" data-src="${escapar(item.href)}#view=FitH" src="about:blank"></iframe>
        </div>
        <div class="recurso__panel-pie">
          <a href="${escapar(item.href)}" target="_blank" rel="noopener">Abrir PDF en otra pestaña ${FLECHA}</a>
          <a href="${escapar(item.href)}" download="${escapar(item.archivo)}">Descargar PDF ${DESCARGA}</a>
        </div>
      </div>`;
}

function pintarLiteratura(item, i) {
  const id = `pdf-lit-${i + 1}-${slug(item.titulo)}`;
  const lectura = [item.lectura, item.paginas].filter(Boolean).join(' · ');
  return `    <article class="recurso recurso--literatura aparece" data-orden="${i}">
      <div class="recurso__superior">
        <div>
          ${item.autor ? `<p class="recurso__autor">${escapar(item.autor)}</p>` : ''}
          <h4 class="recurso__titulo"><em>${escapar(item.titulo)}</em></h4>
        </div>
        <span class="recurso__tipo">${escapar(metaArchivo(item))}</span>
      </div>
      ${lectura ? `<p class="lectura"><span class="lectura__etiqueta">Lectura</span><span class="lectura__detalle">${escapar(lectura)}</span></p>` : ''}
      <div class="recurso__acciones">
${bloqueVisorPdf(item, id)}
        ${botonDescarga(item, item.ext === 'pdf' ? 'Descargar PDF' : 'Descargar archivo')}
        ${item.existe && item.ext === 'pdf' ? `<noscript><a class="accion accion--primaria" href="${escapar(item.href)}" target="_blank" rel="noopener">Abrir PDF ${FLECHA}</a></noscript>` : ''}
      </div>
${panelPdf(item, id, item.titulo)}
    </article>`;
}

function pintarVideo(item, i) {
  const idVideo = youtubeId(item.url);
  const idPanel = `video-${i + 1}-${slug(item.titulo)}`;
  const reproducible = Boolean(idVideo);
  return `    <article class="recurso recurso--video aparece" data-orden="${i}">
      <div class="recurso__superior">
        <div>
          <p class="recurso__autor">YouTube</p>
          <h4 class="recurso__titulo">${escapar(item.titulo)}</h4>
        </div>
        <span class="recurso__tipo">Video</span>
      </div>
      <div class="recurso__acciones">
        ${reproducible ? `<button class="accion accion--primaria js-desplegar" type="button" aria-expanded="false" aria-controls="${escapar(idPanel)}" data-abre="${escapar(idPanel)}" data-texto-abierto="Cerrar video" data-texto-cerrado="Ver video"><span class="js-desplegar-texto">Ver video</span> ${CHEVRON}</button>` : ''}
        <a class="accion accion--secundaria" href="${escapar(item.url)}" target="_blank" rel="noopener">Abrir en YouTube ${FLECHA}</a>
      </div>
      ${reproducible ? `<div class="recurso__panel" id="${escapar(idPanel)}" hidden>
        <div class="visor visor--video">
          <iframe title="Video: ${escapar(item.titulo)}" loading="lazy" data-src="https://www.youtube-nocookie.com/embed/${escapar(idVideo)}?rel=0" src="about:blank" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
      </div>` : ''}
      ${reproducible ? `<noscript><p class="sin-js">JavaScript está desactivado. Puedes abrir el video con el enlace de YouTube.</p></noscript>` : ''}
    </article>`;
}

function pintarOtraClase(item, i) {
  const id = `pdf-otra-${i + 1}-${slug(item.titulo)}`;
  return `    <article class="recurso recurso--archivo aparece" data-orden="${i}">
      <div class="recurso__superior">
        <div>
          ${item.autor ? `<p class="recurso__autor">${escapar(item.autor)}</p>` : ''}
          <h4 class="recurso__titulo">${escapar(item.titulo)}</h4>
        </div>
        <span class="recurso__tipo">${escapar(metaArchivo(item))}</span>
      </div>
      <div class="recurso__acciones">
${bloqueVisorPdf(item, id)}
        ${botonDescarga(item, item.ext === 'pdf' ? 'Descargar PDF' : `Descargar ${item.tipo}`)}
        ${item.existe && item.ext === 'pdf' ? `<noscript><a class="accion accion--primaria" href="${escapar(item.href)}" target="_blank" rel="noopener">Abrir PDF ${FLECHA}</a></noscript>` : ''}
      </div>
${panelPdf(item, id, item.titulo)}
    </article>`;
}

function pintarOtroSitio(item, i) {
  return `    <article class="recurso recurso--sitio aparece" data-orden="${i}">
      <div class="recurso__superior">
        <div>
          <p class="recurso__autor">Sitio externo</p>
          <h4 class="recurso__titulo">${escapar(item.titulo)}</h4>
          ${item.descripcion ? `<p class="recurso__descripcion">${escapar(item.descripcion)}</p>` : ''}
        </div>
      </div>
      <div class="recurso__acciones">
        <a class="accion accion--primaria" href="${escapar(item.url)}" target="_blank" rel="noopener">Visitar sitio ${FLECHA}</a>
      </div>
    </article>`;
}

function pintarSubseccion(id, numero, config, items, render, unidad) {
  const cantidad = items.length;
  const conteo = `${cantidad} ${cantidad === 1 ? unidad.singular : unidad.plural}`;
  const cuerpo = cantidad
    ? `<div class="recursos__lista">\n${items.map(render).join('\n')}\n  </div>`
    : `<div class="vacio"><p>Todavía no hay recursos en esta subsección.</p></div>`;

  return `<section class="recursos__grupo" id="${escapar(id)}">
  <div class="subseccion__encabezado">
    <div class="subseccion__titulo-wrap">
      <span class="subseccion__numero" aria-hidden="true">${String(numero).padStart(2, '0')}</span>
      <div>
        <h3 class="subseccion__titulo">${escapar(config.titulo || id)}</h3>
        ${config.nota ? `<p class="subseccion__nota">${escapar(config.nota)}</p>` : ''}
      </div>
    </div>
    <span class="seccion__conteo">${escapar(conteo)}</span>
  </div>
  ${cuerpo}
</section>`;
}

function pintarRecursos(config, recursos) {
  const literatura = recursos.literatura || [];
  const videos = recursos.videos || [];
  const otras = recursos.otrasClases || [];
  const otrosSitios = recursos.otrosSitios || [];
  const total = literatura.length + videos.length + otras.length + otrosSitios.length;

  return `  <section class="seccion seccion--recursos" id="recursos">
    <div class="contenedor">
      <div class="seccion__encabezado">
        <h2 class="seccion__titulo">${escapar(config.titulo || 'Recursos')}</h2>
        <span class="seccion__conteo">${total} ${total === 1 ? 'recurso' : 'recursos'}</span>
      </div>
      ${config.nota ? `<p class="seccion__nota">${escapar(config.nota)}</p>` : ''}
      <nav class="recursos__indice" aria-label="Tipos de recursos">
        <a href="#literatura">Literatura</a>
        <a href="#videos">Videos</a>
        <a href="#otras-clases">Otras clases</a>
        <a href="#otros-sitios">Otros sitios</a>
      </nav>

${pintarSubseccion('literatura', 1, config.literatura || {}, literatura, pintarLiteratura, { singular: 'texto', plural: 'textos' })}

${pintarSubseccion('videos', 2, config.videos || {}, videos, pintarVideo, { singular: 'video', plural: 'videos' })}

${pintarSubseccion('otras-clases', 3, config.otrasClases || {}, otras, pintarOtraClase, { singular: 'archivo', plural: 'archivos' })}

${pintarSubseccion('otros-sitios', 4, config.otrosSitios || {}, otrosSitios, pintarOtroSitio, { singular: 'sitio', plural: 'sitios' })}
    </div>
  </section>`;
}

/* ---------- construcción ---------- */

async function construir() {
  const contenido = JSON.parse(await readFile(path.join(raiz, 'contenido.json'), 'utf8'));
  const plantilla = await readFile(path.join(raiz, 'sitio', 'plantilla.html'), 'utf8');

  const curso = contenido.curso || {};
  const secciones = contenido.secciones || {};

  const metaSesiones = Object.fromEntries(
    Object.entries(contenido.sesiones || {}).map(([k, v]) => [clave(k), v])
  );
  const sesiones = await reunirSesiones(metaSesiones);

  const recursosCrudos = contenido.recursos || {};
  const recursos = {
    literatura: await prepararArchivos(recursosCrudos.literatura || [], 'literatura'),
    videos: recursosCrudos.videos || [],
    otrasClases: await prepararArchivos(recursosCrudos.otrasClases || [], 'otras-clases'),
    otrosSitios: recursosCrudos.otrosSitios || []
  };

  const tieneRecursos = recursos.literatura.length || recursos.videos.length || recursos.otrasClases.length || recursos.otrosSitios.length;
  const bloques = [
    pintarSesiones(secciones.sesiones || { titulo: 'Sesiones' }, sesiones)
  ];
  if (tieneRecursos) bloques.push(pintarRecursos(secciones.recursos || { titulo: 'Recursos' }, recursos));

  const enlaces = [
    `<a href="#sesiones">${escapar((secciones.sesiones || {}).titulo || 'Sesiones')}</a>`
  ];
  if (tieneRecursos) enlaces.push(`<a href="#recursos">${escapar((secciones.recursos || {}).titulo || 'Recursos')}</a>`);

  const ficha = (curso.ficha || [])
    .map((f) => `<div><dt>${escapar(f.termino)}</dt><dd>${escapar(f.dato)}</dd></div>`)
    .join('\n        ');

  const hoy = new Date();
  const actualizado = `${hoy.getDate()} ${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`;

  const html = plantilla
    .replace(/\{\{TITULO_PAGINA\}\}/g, escapar(curso.nombre || 'Curso'))
    .replace(/\{\{DESCRIPCION\}\}/g, escapar(curso.descripcion || ''))
    .replace(/\{\{CURSO_CORTO\}\}/g, escapar(curso.nombreCorto || curso.nombre || ''))
    .replace(/\{\{CURSO\}\}/g, escapar(curso.nombre || ''))
    .replace(/\{\{EPIGRAFE\}\}/g, escapar(curso.epigrafe || ''))
    .replace(/\{\{BAJADA\}\}/g, escapar(curso.bajada || ''))
    .replace(/\{\{PIE\}\}/g, escapar(curso.pie || ''))
    .replace(/\{\{ACTUALIZADO\}\}/g, escapar(actualizado))
    .replace(/\{\{NAV\}\}/g, enlaces.join('\n      '))
    .replace(/\{\{FICHA\}\}/g, ficha)
    .replace(/\{\{SECCIONES\}\}/g, bloques.join('\n\n'));

  await rm(salida, { recursive: true, force: true });
  await mkdir(salida, { recursive: true });

  await writeFile(path.join(salida, 'index.html'), html, 'utf8');
  for (const activo of ['estilos.css', 'sitio.js', 'favicon.svg']) {
    await copyFile(path.join(raiz, 'sitio', activo), path.join(salida, activo));
  }

  const nS = await copiarCarpeta(path.join(raiz, 'sesiones'), path.join(salida, 'sesiones'));
  const nR = await copiarCarpeta(path.join(raiz, 'recursos'), path.join(salida, 'recursos'));

  const archivosRecursos = [...recursos.literatura, ...recursos.otrasClases];
  const faltantes = archivosRecursos.filter((x) => !x.existe);
  const pesados = archivosRecursos.filter((x) => x.existe && x.bytes > 45 * 1024 * 1024);

  console.log(`\n  Sitio construido en publicado/`);
  console.log(`  ${sesiones.length} sesión(es), ${recursos.literatura.length} lectura(s), ${recursos.videos.length} video(s), ${recursos.otrasClases.length} archivo(s) de otras clases, ${recursos.otrosSitios.length} sitio(s) externo(s).`);
  console.log(`  ${nS + nR} archivo(s) copiado(s) al sitio publicado.`);

  if (faltantes.length) {
    console.log(`\n  Aviso: faltan ${faltantes.length} archivo(s) declarados en contenido.json:`);
    faltantes.forEach((x) => console.log(`    · ${x.archivo}`));
  }

  if (pesados.length) {
    console.log(`\n  Aviso: hay recursos sobre 45 MB. GitHub avisa sobre 50 MB y rechaza archivos sobre 100 MB.`);
    pesados.forEach((x) => console.log(`    · ${x.archivo} (${pesoLegible(x.bytes)})`));
  }
  console.log('');
}

construir().catch((e) => {
  console.error('\n  No se pudo construir el sitio:\n ', e.message, '\n');
  process.exit(1);
});
