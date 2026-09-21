const express = require('express');
const config = require('../config');
const sections = require('../../config/sections');
const posts = require('../models/posts');
const { cleanContent } = require('../utils/text');

const router = express.Router();
const sectionBySlug = Object.fromEntries(sections.map((s) => [s.slug, s]));

const pageNum = (v) => Math.max(1, parseInt(v, 10) || 1);
const notFound = (res) => res.status(404).render('error', { pageTitle: '404', code: 404, message: 'یہ صفحہ نہیں مل سکا۔' });

// Builds the pagination data used by views/partials/pagination.ejs
function pager(result, makeUrl) {
  return { page: result.page, pages: result.pages, url: makeUrl };
}

// ---------------------------------------------------------------- Home
router.get('/', async (req, res) => {
  const page = pageNum(req.query.page);
  const [result, counts] = await Promise.all([
    posts.list({ status: 'published', page, perPage: config.perPage }),
    posts.countsBySection(),
  ]);
  res.render('index', {
    pageTitle: null,
    canonical: '/' + (result.page > 1 ? `?page=${result.page}` : ''),
    result,
    counts,
    pager: pager(result, (n) => (n === 1 ? '/' : `/?page=${n}`)),
  });
});

// ---------------------------------------------------------------- Section
router.get('/section/:slug', async (req, res) => {
  const section = sectionBySlug[req.params.slug];
  if (!section) return notFound(res);
  const page = pageNum(req.query.page);
  const result = await posts.list({ section: section.slug, status: 'published', page, perPage: config.perPage });
  const base = `/section/${section.slug}`;
  res.render('section', {
    pageTitle: section.title,
    description: section.desc,
    canonical: base + (result.page > 1 ? `?page=${result.page}` : ''),
    section,
    result,
    pager: pager(result, (n) => (n === 1 ? base : `${base}?page=${n}`)),
  });
});

// ---------------------------------------------------------------- Single post
// Works as /post/12 and as /post/12/optional-english-slug
router.get(['/post/:id', '/post/:id/:slug'], async (req, res) => {
  if (!/^\d{1,9}$/.test(req.params.id)) return notFound(res);
  const post = await posts.get(parseInt(req.params.id, 10));
  if (!post) return notFound(res);
  if (post.status !== 'published' && !req.admin) return notFound(res); // drafts are private

  const canonicalPath = res.locals.postUrl(post);
  if (post.status === 'published' && req.path !== canonicalPath && decodeURI(req.path) !== canonicalPath) {
    return res.redirect(301, canonicalPath);
  }

  if (post.status === 'published' && !req.admin) posts.addView(post.id).catch(() => {});
  const related = await posts.related(post, 3);
  post.content = cleanContent(post.content); // extra safety: sanitise again before showing

  res.render('post', {
    pageTitle: post.title,
    description: post.excerpt,
    canonical: canonicalPath,
    ogType: 'article',
    ogImage: post.cover_url || '',
    htmlLang: post.lang,
    post,
    section: sectionBySlug[post.section] || null,
    related,
    bodyClass: 'is-post',
  });
});

// ---------------------------------------------------------------- Search
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  const page = pageNum(req.query.page);
  const result = q
    ? await posts.list({ status: 'published', q, page, perPage: config.perPage })
    : { rows: [], total: 0, page: 1, pages: 1 };
  res.render('search', {
    pageTitle: q ? `تلاش: ${q}` : 'تلاش',
    q,
    result,
    robotsNoindex: true,
    pager: pager(result, (n) => `/search?q=${encodeURIComponent(q)}&page=${n}`),
  });
});

// ---------------------------------------------------------------- About
router.get('/about', (req, res) => {
  res.render('about', { pageTitle: 'تعارف', canonical: '/about' });
});

// ---------------------------------------------------------------- SEO helpers
router.get('/robots.txt', (req, res) => {
  // A custom admin address is NOT written here, otherwise robots.txt would reveal it.
  // (Admin pages already tell search engines "noindex" by themselves.)
  const hideDefault = config.adminPath === '/admin' ? 'Disallow: /admin/\n' : '';
  res.type('text/plain').send(
    `User-agent: *\n${hideDefault}Disallow: /search\nSitemap: ${config.siteUrl}/sitemap.xml\n`
  );
});

router.get('/sitemap.xml', async (req, res) => {
  const rows = await posts.forSitemap();
  const urls = [
    { loc: '/', lastmod: null },
    { loc: '/about', lastmod: null },
    ...sections.map((s) => ({ loc: `/section/${s.slug}`, lastmod: null })),
    ...rows.map((p) => ({ loc: res.locals.postUrl(p), lastmod: p.updated_at })),
  ];
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${esc(config.siteUrl + encodeURI(u.loc))}</loc>${
            u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''
          }</url>`
      )
      .join('\n') +
    '\n</urlset>';
  res.type('application/xml').send(xml);
});

module.exports = router;
