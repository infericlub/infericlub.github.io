(function () {
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }

  function flash(btn, label, cls) {
    if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.textContent;
    btn.textContent = label;
    if (cls) btn.classList.add(cls);
    clearTimeout(btn._flashT);
    btn._flashT = setTimeout(function () {
      btn.textContent = btn.dataset.origLabel;
      if (cls) btn.classList.remove(cls);
    }, 1500);
  }

  document.querySelectorAll('[data-copy-snippet]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.snippet');
      var code = box && box.querySelector('pre code');
      if (!code) return;
      var text = code.textContent.replace(/\n+$/, '');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () { flash(btn, 'copied!', 'is-copied'); })
          .catch(function () {
            if (fallbackCopy(text)) flash(btn, 'copied!', 'is-copied');
            else flash(btn, 'failed');
          });
      } else {
        if (fallbackCopy(text)) flash(btn, 'copied!', 'is-copied');
        else flash(btn, 'failed');
      }
    });
  });

  var search = document.querySelector('[data-snippet-search]');
  var empty = document.querySelector('[data-snippet-empty]');
  if (!search) return;

  function filter() {
    var q = search.value.trim().toLowerCase();
    var visible = 0;
    document.querySelectorAll('.snippet[data-snippet-title]').forEach(function (s) {
      var title = s.dataset.snippetTitle || '';
      var tags  = s.dataset.snippetTags  || '';
      var hit = !q || title.indexOf(q) !== -1 || tags.indexOf(q) !== -1;
      s.hidden = !hit;
      if (hit) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }

  search.addEventListener('input', filter);
})();
