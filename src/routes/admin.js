const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const sections = require('../../config/sections');
const posts = require('../models/posts');
const { requireAdmin, verifyCsrf, checkPassword, startSession, endSession } = require('../middleware/auth');
const { cleanContent, toPlainText, makeExcerpt, readingMinutes, slugify, safeUrl } = require('../utils/text');

const router = express.Router();
const base = config.adminPath;
const sectionSlugs = sections.map((s) => s.slug);

// Everything under the admin path: never cached, never indexed by Google.
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.locals.robotsNoindex = true;
  res.locals.bodyClass = 'admin';
  res.locals.htmlLang = 'en';
  res.locals.htmlDir = 'ltr';
  next();
});

const MESSAGES = {
  created: 'Post created.',
  saved: 'Changes saved.',
  deleted: 'Post deleted.',
  published: 'Post published.',
  unpublished: 'Post moved to drafts.',
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) =>
    res.status(429).render('admin/login', {
      pageTitle: 'Admin login',
      error: 'Too many wrong attempts. Please wait 15 minutes and try again.',
    }),
});

// ------------------------------------------------------------ Login / logout
router.get('/login', (req, res) => {
  if (req.admin) return res.redirect(base);
  res.render('admin/login', { pageTitle: 'Admin login', error: null });
});

router.post('/login', loginLimiter, (req, res) => {
  if (!checkPassword(req.body && req.body.password)) {
    return res.status(401).render('admin/login', { pageTitle: 'Admin login', error: 'Wrong password.' });
  }
  startSession(res, req.body.remember === 'on');
  res.redirect(base);
});

router.post('/logout', requireAdmin, verifyCsrf, (req, res) => {
  endSession(res);
  res.redirect(base + '/login');
});

// Everything below needs a logged-in admin.
router.use(requireAdmin);

// ------------------------------------------------------------ Dashboard
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  const section = sectionSlugs.includes(req.query.section) ? req.query.section : '';
  const status = ['published', 'draft'].includes(req.query.status) ? req.query.status : '';
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const [result, stats] = await Promise.all([
    posts.list({ q, section, status, page, perPage: config.adminPerPage }),
    posts.stats(),
  ]);

  const qs = (n) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (section) p.set('section', section);
    if (status) p.set('status', status);
    if (n > 1) p.set('page', n);
    const s = p.toString();
    return base + (s ? '?' + s : '');
  };

  res.render('admin/dashboard', {
    pageTitle: 'Dashboard',
    result,
    stats,
    filters: { q, section, status },
    flash: MESSAGES[req.query.msg] || null,
    pager: { page: result.page, pages: result.pages, url: qs },
  });
});

// ------------------------------------------------------------ Create / edit form
const emptyPost = { id: null, title: '', slug: '', section: sectionSlugs[0], lang: 'ur', excerpt: '', content: '', cover_url: '', download_url: '', status: 'published' };

router.get('/posts/new', (req, res) => {
  res.render('admin/edit', { pageTitle: 'New post', post: { ...emptyPost, section: sectionSlugs.includes(req.query.section) ? req.query.section : emptyPost.section }, error: null });
});

router.get('/posts/:id/edit', async (req, res, next) => {
  if (!/^\d{1,9}$/.test(req.params.id)) return next();
  const post = await posts.get(parseInt(req.params.id, 10));
  if (!post) return next();
  res.render('admin/edit', { pageTitle: 'Edit post', post, error: null });
});

// Validates the form and builds the object we store.
function readForm(body) {
  const title = String(body.title || '').trim().slice(0, 300);
  const section = String(body.section || '');
  const lang = body.lang === 'ar' ? 'ar' : 'ur';
  const status = body.status === 'draft' ? 'draft' : 'published';
  const content = cleanContent(String(body.content || '').slice(0, 1_500_000));
  const plain = toPlainText(content);
  const excerptIn = toPlainText(String(body.excerpt || '')).slice(0, 400);

  const errors = [];
  if (!title) errors.push('Title is required.');
  if (!sectionSlugs.includes(section)) errors.push('Please choose a section.');
  if (!plain) errors.push('The post body is empty.');

  const data = {
    title,
    slug: slugify(body.slug || ''),
    section,
    lang,
    excerpt: excerptIn || makeExcerpt(plain),
    content,
    cover_url: safeUrl(body.cover_url),
    download_url: safeUrl(body.download_url),
    status,
    read_min: readingMinutes(plain),
  };
  return { data, errors, rawExcerpt: excerptIn };
}

router.post('/posts', verifyCsrf, async (req, res) => {
  const { data, errors, rawExcerpt } = readForm(req.body);
  if (errors.length) {
    return res.status(422).render('admin/edit', {
      pageTitle: 'New post',
      post: { ...emptyPost, ...data, excerpt: rawExcerpt },
      error: errors.join(' '),
    });
  }
  const id = await posts.create(data);
  res.redirect(`${base}/posts/${id}/edit?msg=created`);
});

router.post('/posts/:id', verifyCsrf, async (req, res, next) => {
  if (!/^\d{1,9}$/.test(req.params.id)) return next();
  const id = parseInt(req.params.id, 10);
  const { data, errors, rawExcerpt } = readForm(req.body);
  if (errors.length) {
    return res.status(422).render('admin/edit', {
      pageTitle: 'Edit post',
      post: { ...emptyPost, ...data, excerpt: rawExcerpt, id },
      error: errors.join(' '),
    });
  }
  const ok = await posts.update(id, data);
  if (!ok) return next();
  res.redirect(`${base}/posts/${id}/edit?msg=saved`);
});

// ------------------------------------------------------------ Delete / publish toggle
router.post('/posts/:id/delete', verifyCsrf, async (req, res, next) => {
  if (!/^\d{1,9}$/.test(req.params.id)) return next();
  await posts.remove(parseInt(req.params.id, 10));
  res.redirect(`${base}?msg=deleted`);
});

router.post('/posts/:id/toggle', verifyCsrf, async (req, res, next) => {
  if (!/^\d{1,9}$/.test(req.params.id)) return next();
  const id = parseInt(req.params.id, 10);
  const post = await posts.get(id);
  if (!post) return next();
  const next_ = post.status === 'published' ? 'draft' : 'published';
  await posts.setStatus(id, next_);
  res.redirect(`${base}?msg=${next_ === 'published' ? 'published' : 'unpublished'}`);
});

module.exports = router;
