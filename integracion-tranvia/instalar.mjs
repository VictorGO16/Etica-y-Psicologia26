import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const manifest = readJSON(path.join(here, 'MANIFEST.json'));
const source = path.join(here, 'paquete');
const checkOnly = process.argv.includes('--check');

function fail(message) { throw new Error(message + '\nNo se modificó ningún archivo.'); }
function destination(relative) { return path.join(root, relative); }
function readSource(relative) { return fs.readFileSync(path.join(source, relative)); }

// Apply only the original integration hunks, instead of replacing the whole
// generator. This preserves new sessions and unrelated changes in the project.
function normalise(text) { return text.replace(/\r\n/g, '\n'); }
function parsePatch(text) {
  const hunks = [];
  let oldLines = null, newLines = null;
  const finish = () => {
    if (oldLines !== null) {
      hunks.push({ before: oldLines.join('\n') + '\n', after: newLines.join('\n') + '\n' });
    }
  };
  for (const line of normalise(text).split('\n')) {
    if (line.startsWith('@@ ')) {
      finish(); oldLines = []; newLines = [];
    } else if (oldLines !== null && line.length && ' +-'.includes(line[0])) {
      if (line[0] !== '+') oldLines.push(line.slice(1));
      if (line[0] !== '-') newLines.push(line.slice(1));
    }
  }
  finish();
  if (!hunks.length) fail('El paquete no contiene parches válidos para el generador.');
  return hunks;
}
function patchGenerator(original) {
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  let text = normalise(original);
  const patch = fs.readFileSync(path.join(here, 'parches', 'scripts_construir.mjs.patch'), 'utf8');
  for (const [index, hunk] of parsePatch(patch).entries()) {
    const first = text.indexOf(hunk.before);
    if (first < 0 || text.indexOf(hunk.before, first + 1) >= 0) {
      fail('No se pudo aplicar de forma segura el fragmento ' + (index + 1) +
        ' del generador. No se reemplazará tu archivo.');
    }
    text = text.slice(0, first) + hunk.after + text.slice(first + hunk.before.length);
  }
  return Buffer.from(text.replace(/\n/g, newline));
}

const generator = destination('scripts/construir.mjs');
if (!fs.existsSync(generator)) fail('Ejecuta este instalador desde la raíz del clon, junto a package.json.');
const patchedGenerator = patchGenerator(fs.readFileSync(generator, 'utf8'));
const pkg = readJSON(destination('package.json'));
const vercel = readJSON(destination('vercel.json'));
const content = readJSON(destination('contenido.json'));
if (pkg.scripts?.build !== 'node scripts/construir.mjs' || vercel.outputDirectory !== 'publicado') {
  fail('La configuración del proyecto no coincide con la revisada.');
}
if (!content.secciones?.recursos || !content.recursos || !Array.isArray(content.recursos.otrosSitios) || content.recursos.juegos || content.secciones.recursos.juegos) {
  fail('La estructura de Recursos cambió o Juegos ya está instalado.');
}
for (const relative of manifest.added_files) {
  if (fs.existsSync(destination(relative))) fail('Ya existe ' + relative + '.');
}
// Prepare every destination before writing anything. Keep the other project settings.
const changes = new Map();
changes.set('scripts/construir.mjs', patchedGenerator);
const nextContent = structuredClone(content);
nextContent.secciones.recursos.juegos = { titulo: 'Juegos' };
nextContent.recursos = Object.fromEntries(Object.entries(nextContent.recursos).flatMap(([key,value]) => key === 'otrosSitios' ? [
  ['juegos', [{ titulo: 'El tranvía', url: '/tranvia/', descripcion: 'Cuatro situaciones para elegir y justificar una decisión.' }]],
  [key,value]
] : [[key,value]]));
changes.set('contenido.json', Buffer.from(JSON.stringify(nextContent,null,2)+'\n'));
pkg.engines = { ...pkg.engines, node: '22.x' };
pkg.dependencies = { ...pkg.dependencies, '@neondatabase/serverless': '1.1.0' };
changes.set('package.json', Buffer.from(JSON.stringify(pkg,null,2)+'\n'));
vercel.buildCommand = 'npm run build';
vercel.installCommand = 'npm install';
changes.set('vercel.json', Buffer.from(JSON.stringify(vercel,null,2)+'\n'));
for (const relative of manifest.added_files) changes.set(relative,readSource(relative));

console.log('Integración compatible. Archivos que se modificarán o crearán:');
for (const relative of changes.keys()) console.log('  ' + relative);
if (checkOnly) { console.log('\nComprobación terminada. No se modificó nada.'); process.exit(0); }

// Stage all content first. If an unexpected write fails, restore the original files.
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'tranvia-install-'));
const originals = new Map();
const written = [];
const createdDirectories = [];
try {
  for (const [relative,bytes] of changes) {
    const staged = path.join(temp,relative);
    fs.mkdirSync(path.dirname(staged),{recursive:true});
    fs.writeFileSync(staged,bytes);
    const dest = destination(relative);
    originals.set(relative,fs.existsSync(dest)?fs.readFileSync(dest):null);
  }
  for (const relative of changes.keys()) {
    const dest = destination(relative);
    const missing = [];
    for (let dir = path.dirname(dest); !fs.existsSync(dir); dir = path.dirname(dir)) missing.push(dir);
    for (const dir of missing.reverse()) { fs.mkdirSync(dir); createdDirectories.push(dir); }
    const staged = path.join(temp,relative);
    const adjacent = dest+'.tranvia-install-tmp';
    if (fs.existsSync(adjacent)) throw new Error('Existe un archivo temporal previo: '+adjacent);
    fs.copyFileSync(staged,adjacent);
    try { fs.renameSync(adjacent,dest); } catch(e) { fs.rmSync(adjacent,{force:true}); throw e; }
    written.push(relative);
  }
  console.log('\nIntegración instalada. Ahora ejecuta npm install y npm run build.');
} catch(error) {
  for (const relative of written.reverse()) {
    const old = originals.get(relative),dest = destination(relative);
    if (old === null) fs.rmSync(dest,{force:true});
    else fs.writeFileSync(dest,old);
  }
  for (const dir of createdDirectories.reverse()) {
    try { fs.rmdirSync(dir); } catch {}
  }
  throw new Error('No se pudo instalar; se restauraron los archivos originales. '+error.message);
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
