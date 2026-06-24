(function () {
  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  var root = document.documentElement;

  function sync() {
    var t = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
  }

  sync();

  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
})();
