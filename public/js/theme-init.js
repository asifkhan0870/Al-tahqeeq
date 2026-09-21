// Runs before the page is drawn, so there is no white flash in dark mode.
(function () {
  try {
    var d = document.documentElement;
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    d.setAttribute('data-theme', t);
    var face = localStorage.getItem('readFace');
    if (face === 'naskh' || face === 'nastaliq') d.setAttribute('data-face', face);
    var size = parseInt(localStorage.getItem('readSize'), 10);
    if (size >= 16 && size <= 44) d.style.setProperty('--read-size', size + 'px');
  } catch (e) {}
})();
