/* Animación de entrada + visores desplegables de PDF y YouTube.
   Los archivos descargables siguen funcionando aunque falle JavaScript. */

(function () {
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var elementos = document.querySelectorAll('.aparece');

  if (reducido || !('IntersectionObserver' in window)) {
    elementos.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var el = entrada.target;
        var i = Number(el.dataset.orden || 0);
        el.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
        el.classList.add('visible');
        observador.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    elementos.forEach(function (el) { observador.observe(el); });
  }

  function actualizarBoton(boton, abierto) {
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    var texto = boton.querySelector('.js-desplegar-texto');
    if (texto) texto.textContent = abierto ? boton.dataset.textoAbierto : boton.dataset.textoCerrado;
  }

  document.querySelectorAll('.js-desplegar').forEach(function (boton) {
    boton.addEventListener('click', function () {
      var panel = document.getElementById(boton.dataset.abre || '');
      if (!panel) return;

      var abrir = panel.hidden;
      panel.hidden = !abrir;
      actualizarBoton(boton, abrir);

      if (abrir) {
        var iframe = panel.querySelector('iframe[data-src]');
        if (iframe && iframe.getAttribute('src') === 'about:blank') {
          iframe.setAttribute('src', iframe.dataset.src);
        }
      }
    });
  });
})();
