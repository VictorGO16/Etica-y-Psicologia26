/* =========================================================
   Construye el sitio en la carpeta publicado/
   No necesita instalar nada: sólo Node.
   =========================================================
   Qué hace:
   1. lee contenido.json
   2. mira qué archivos .html hay en sesiones/ y en apps/
   3. arma el index.html a partir de sitio/plantilla.html
   4. copia todo a publicado/
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

// Normalizamos a NFC porque macOS guarda los nombres de archivo con las
// tildes descompuestas (NFD) y así "Introducción" coincide igual.
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

/* ---------- armado de las piezas ---------- */

const FLECHA =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<path d="M2 8h11M9 4l4 4-4 4"/></svg>';

async function reunir(carpeta, metadatos) {
  const archivos = await listarHtml(path.join(raiz, carpeta));
  const publicados = new Set(archivos.map(clave));

  const items = archivos.map((archivo) => {
    const meta = metadatos[clave(archivo)] || metadatos[archivo] || {};
    const leido = leerNombre(archivo);
    return {
      archivo,
      publicado: true,
      href: `${carpeta}/${encodeURIComponent(archivo)}`,
      numero: meta.numero ?? leido.numero,
      titulo: meta.titulo || leido.titulo,
      resumen: meta.resumen || '',
      fecha: meta.fecha || ''
    };
  });

  // Sesiones anunciadas en contenido.json cuyo archivo todavía no existe:
  // se muestran atenuadas, para que el listado sea el programa del semestre
  // y no sólo el archivo de lo ya dictado.
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

function pintarFila(item, i) {
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
    ? `          <a class="fila__enlace" href="${escapar(item.href)}" target="_blank" rel="noopener">
${interior}
          </a>`
    : `          <div class="fila__enlace">
${interior}
          </div>`;

  return `        <li class="fila${item.publicado ? '' : ' fila--espera'} aparece" data-orden="${i}">
${bloque}
          <div class="fila__regla" aria-hidden="true"><span></span></div>
        </li>`;
}

function pintarSeccion(id, config, items, carpeta) {
  const listas = items.filter((x) => x.publicado).length;
  const conteo = listas === 1 ? '1 publicada' : `${listas} publicadas`;

  const cuerpo = items.length
    ? `      <ul class="listado">
${items.map(pintarFila).join('\n')}
      </ul>`
    : `      <div class="vacio">
        <p>${escapar(config.vacio || 'Todavía no hay nada publicado aquí.')}</p>
        <p>Deja un archivo <code>.html</code> en la carpeta <code>${escapar(carpeta)}/</code>, con un nombre como <code>S1 - Título.html</code>, y aparecerá en esta lista.</p>
      </div>`;

  return `  <section class="seccion" id="${escapar(id)}">
    <div class="contenedor">
      <div class="seccion__encabezado">
        <h2 class="seccion__titulo">${escapar(config.titulo || id)}</h2>
        ${items.length ? `<span class="seccion__conteo">${conteo}</span>` : ''}
      </div>
      ${config.nota ? `<p class="seccion__nota">${escapar(config.nota)}</p>` : ''}
${cuerpo}
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
  const metaApps = Object.fromEntries(
    Object.entries(contenido.apps || {}).map(([k, v]) => [clave(k), v])
  );

  const sesiones = await reunir('sesiones', metaSesiones);
  const apps = await reunir('apps', metaApps);

  const bloques = [
    pintarSeccion('sesiones', secciones.sesiones || { titulo: 'Sesiones' }, sesiones, 'sesiones')
  ];
  // La sección de recursos sólo aparece cuando hay algo dentro.
  if (apps.length) {
    bloques.push(pintarSeccion('recursos', secciones.apps || { titulo: 'Recursos' }, apps, 'apps'));
  }

  const enlaces = [`<a href="#sesiones">${escapar((secciones.sesiones || {}).titulo || 'Sesiones')}</a>`];
  if (apps.length) enlaces.push(`<a href="#recursos">${escapar((secciones.apps || {}).titulo || 'Recursos')}</a>`);

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
  const nA = await copiarCarpeta(path.join(raiz, 'apps'), path.join(salida, 'apps'));

  let pesado = [];
  for (const item of [...sesiones, ...apps]) {
    const carpeta = sesiones.includes(item) ? 'sesiones' : 'apps';
    try {
      const s = await stat(path.join(raiz, carpeta, item.archivo));
      if (s.size > 45 * 1024 * 1024) pesado.push(`${item.archivo} (${(s.size / 1048576).toFixed(0)} MB)`);
    } catch {}
  }

  console.log(`\n  Sitio construido en publicado/`);
  console.log(`  ${sesiones.length} sesión(es), ${apps.length} recurso(s), ${nS + nA} archivo(s) copiado(s).`);
  if (!sesiones.length) {
    console.log(`  Aviso: la carpeta sesiones/ está vacía; el sitio se publica igual, con el aviso correspondiente.`);
  }
  if (pesado.length) {
    console.log(`\n  Aviso: hay archivos sobre 45 MB. GitHub avisa sobre los 50 MB y rechaza sobre los 100 MB.`);
    pesado.forEach((p) => console.log(`    · ${p}`));
    console.log(`  Mira la sección "Si un HTML pesa demasiado" del LEEME.md.`);
  }
  console.log('');
}

construir().catch((e) => {
  console.error('\n  No se pudo construir el sitio:\n ', e.message, '\n');
  process.exit(1);
});
