(function () {
  'use strict';
  if (typeof Quill === 'undefined') return;

  // --- Fonts the writer can pick inside a paragraph
  var Font = Quill.import('formats/font');
  Font.whitelist = ['urdu', 'arabic'];
  Quill.register(Font, true);

  // --- "LTR" paragraph (for English text inside an Urdu article)
  var Parchment = Quill.import('parchment');
  var Ltr = new Parchment.Attributor.Class('ltr', 'ql-ltr', { scope: Parchment.Scope.BLOCK, whitelist: ['yes'] });
  Quill.register(Ltr, true);

  // --- Links: "example.com" automatically becomes "https://example.com"
  var Link = Quill.import('formats/link');
  var origSanitize = Link.sanitize;
  Link.sanitize = function (url) {
    if (url && !/^([a-z][a-z0-9+.\-]*:|\/|#)/i.test(url)) url = 'https://' + url;
    return origSanitize.call(this, url);
  };

  var quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'یہاں اپنی تحقیق لکھیں…',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        [{ font: [false, 'urdu', 'arabic'] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        [{ ltr: 'yes' }],
        ['link'],
        ['clean'],
      ],
    },
  });

  // Tooltips for the toolbar buttons
  var tips = {
    'ql-bold': 'Bold', 'ql-italic': 'Italic', 'ql-underline': 'Underline', 'ql-strike': 'Strikethrough',
    'ql-blockquote': 'Quote box (good for verses and hadith)', 'ql-link': 'Add / edit link', 'ql-clean': 'Remove formatting',
    'ql-ltr': 'Left-to-right paragraph (for English text)',
  };
  document.querySelectorAll('.ql-toolbar button').forEach(function (b) {
    Object.keys(tips).forEach(function (c) { if (b.classList.contains(c)) b.setAttribute('title', tips[c]); });
    if (b.classList.contains('ql-list')) b.setAttribute('title', b.value === 'ordered' ? 'Numbered list' : 'Bullet list');
  });

  // Load the existing content (when editing)
  var initial = document.getElementById('initial-content').value;
  if (initial && initial.trim()) quill.clipboard.dangerouslyPasteHTML(initial, 'silent');

  // Language switch changes the editor font
  var wrap = document.getElementById('editor-wrap');
  document.querySelectorAll('input[name="lang"]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (!r.checked) return;
      wrap.classList.remove('lang-ur', 'lang-ar');
      wrap.classList.add('lang-' + r.value);
    });
  });

  // Copy the editor content into the form before sending
  var form = document.getElementById('post-form');
  var dirty = false;
  quill.on('text-change', function () { dirty = true; });
  form.addEventListener('input', function () { dirty = true; });
  form.addEventListener('submit', function () {
    dirty = false;
    var input = document.getElementById('content-input');
    input.value = quill.getText().trim() ? quill.root.innerHTML : '';
  });
  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  // Success message after saving (?msg=saved)
  var m = new URLSearchParams(location.search).get('msg');
  var msgs = { created: 'Post created. You can keep editing here.', saved: 'Changes saved.' };
  if (m && msgs[m]) {
    var f = document.getElementById('flash');
    f.textContent = msgs[m]; f.hidden = false;
    history.replaceState(null, '', location.pathname);
  }
})();
