import {escapeHTML,dateLabel} from './common.js';

export function sessionCard(s){
  return `<article class="attendance-card" data-expires="${s.expiresAt}"><p class="eyebrow">${escapeHTML(dateLabel(s.date))}</p><h2>Módulo ${s.module}</h2><img class="qr" src="/api/asistencia?action=qr&amp;id=${s.id}" alt="QR para registrar asistencia del módulo ${s.module}"><p class="countdown" data-timer="${s.expiresAt}"></p><p class="device-rule">Solo una persona por dispositivo para esta fecha y módulo.</p><p class="muted">${s.requireLocation?'Requiere compartir ubicación.':'Escanea el QR para abrir el formulario.'}</p>${s.showButton?`<a class="btn secondary" href="./registrar.html?token=${s.token}">Abrir formulario</a>`:''}</article>`;
}
