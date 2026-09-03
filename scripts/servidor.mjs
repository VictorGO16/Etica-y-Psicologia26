/* Servidor local para ver el sitio antes de publicarlo.
   No instala nada: usa sólo lo que trae Node.
   Uso: npm run vista */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'publicado');
const puerto = Number(process.env.PORT || 4173);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.woff2': 'font/woff2'
};

createServer(async (peticion, respuesta) => {
  try {
    let ruta = decodeURIComponent(new URL(peticion.url, 'http://local').pathname);
    if (ruta.endsWith('/')) ruta += 'index.html';

    const archivo = path.join(raiz, path.normalize(ruta));
    if (!archivo.startsWith(raiz)) {
      respuesta.writeHead(403).end('Prohibido');
      return;
    }

    const info = await stat(archivo);
    if (info.isDirectory()) {
      respuesta.writeHead(302, { Location: ruta + '/' }).end();
      return;
    }

    respuesta.writeHead(200, {
      'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-store'
    });
    createReadStream(archivo).pipe(respuesta);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    respuesta.end('<p style="font-family:system-ui;padding:2rem">No existe esa página. Vuelve a <a href="/">la portada</a>.</p>');
  }
}).listen(puerto, () => {
  console.log(`\n  Sitio disponible en http://localhost:${puerto}\n  Ctrl+C para detenerlo.\n`);
});
