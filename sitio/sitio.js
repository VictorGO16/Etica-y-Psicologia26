/* Entrada escalonada de las filas. Nada más: el contenido ya viene
   escrito en el HTML, así que la página funciona igual sin JavaScript. */

(function () {
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var elementos = document.querySelectorAll('.aparece');

  if (reducido || !('IntersectionObserver' in window)) {
    elementos.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

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
})();
