const sanitizeHtml = require('sanitize-html');

// Classes produced by the editor that we allow to survive.
const ALLOWED_CLASSES = [
  'ql-align-center', 'ql-align-right', 'ql-align-justify',
  'ql-font-arabic', 'ql-font-urdu',
  'ql-ltr-yes',
];

// Make "example.com" behave like "https://example.com" and block anything unsafe.
function fixHref(href = '') {
  const h = String(href).trim();
  if (!h) return '';
  if (/^(https?:|mailto:|tel:)/i.test(h)) return h;
  if (h.startsWith('/') && !h.startsWith('//')) return h;
  if (h.startsWith('#')) return h;
  if (/^[a-z][a-z0-9+.\-]*:/i.test(h)) return ''; // javascript:, data:, etc. -> removed
  return 'https://' + h.replace(/^\/+/, '');
}

// Cleans the HTML coming from the editor. Only safe tags survive, so nobody
// (not even by accident) can inject scripts into your pages.
function cleanContent(html = '') {
  return sanitizeHtml(String(html), {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'span', 'hr'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      p: ['class'], h2: ['class'], h3: ['class'], h4: ['class'], li: ['class'], blockquote: ['class'], span: ['class'],
    },
    allowedClasses: { '*': ALLOWED_CLASSES },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = fixHref(attribs.href);
        if (!href) return { tagName: 'span', attribs: {} }; // unsafe link -> keep the text, drop the link
        const out = { href };
        if (/^https?:/i.test(href)) {
          out.target = '_blank';
          out.rel = 'noopener noreferrer';
        }
        return { tagName: 'a', attribs: out };
      },
    },
  });
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// Plain text version of HTML (for excerpts, search, reading time).
function toPlainText(html = '') {
  const withBreaks = String(html).replace(/<\/(p|h2|h3|h4|li|blockquote)>/gi, ' ').replace(/<br\s*\/?>/gi, ' ');
  const stripped = sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} });
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}

function makeExcerpt(text, max = 220) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function readingMinutes(text) {
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 170));
}

// English-only slug (optional, makes prettier links). Urdu titles simply get no slug.
function slugify(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
}

function safeUrl(u = '') {
  const v = String(u).trim();
  if (!v) return '';
  return /^https?:\/\/[^\s]+$/i.test(v) ? v.slice(0, 2000) : '';
}

module.exports = { cleanContent, toPlainText, makeExcerpt, readingMinutes, slugify, safeUrl };
