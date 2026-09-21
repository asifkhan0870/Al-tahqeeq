(function () {
  'use strict';
  var root = document.documentElement;
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // ---- Dark / light mode
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      save('theme', next);
    });
  }

  // ---- Mobile menu
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---- Reader tools: font size + Nastaliq / Naskh
  document.querySelectorAll('.reader-tools [data-size]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cur = parseInt(getComputedStyle(root).getPropertyValue('--read-size'), 10) || 22;
      var next = Math.min(44, Math.max(16, cur + parseInt(btn.getAttribute('data-size'), 10)));
      root.style.setProperty('--read-size', next + 'px');
      save('readSize', String(next));
    });
  });
  var face = document.getElementById('face-toggle');
  if (face) {
    face.addEventListener('click', function () {
      var next = root.getAttribute('data-face') === 'naskh' ? 'nastaliq' : 'naskh';
      root.setAttribute('data-face', next);
      save('readFace', next);
    });
  }

  // ---- Reading progress bar
  var bar = document.getElementById('progress');
  if (bar) {
    var ticking = false;
    var update = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // ---- Copy link
  var copy = document.getElementById('copy-link');
  if (copy) {
    copy.addEventListener('click', function () {
      var url = copy.getAttribute('data-url');
      var done = function () {
        copy.classList.add('done');
        setTimeout(function () { copy.classList.remove('done'); }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      } else {
        window.prompt('Copy this link:', url);
      }
    });
  }

  // ---- "Are you sure?" on delete buttons (works with the strict security policy)
  document.querySelectorAll('form[data-confirm]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      if (!window.confirm(f.getAttribute('data-confirm'))) e.preventDefault();
    });
  });
})();
