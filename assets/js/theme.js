(function () {
  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  var glyph = btn.querySelector('[data-theme-glyph]');
  var root = document.documentElement;

  function sync() {
    var t = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    if (glyph) glyph.textContent = t === 'dark' ? 'light' : 'dark';
  }

  sync();

  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
})();
