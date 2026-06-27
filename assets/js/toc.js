(function () {
  var toc = document.getElementById('markdown-toc');
  var slot = document.getElementById('toc-slot');
  var sidebar = document.getElementById('toc-sidebar');
  if (!toc || !slot || !sidebar) return;
  slot.appendChild(toc);
  sidebar.hidden = false;
})();
