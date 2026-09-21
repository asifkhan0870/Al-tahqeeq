const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const config = require('./config');
const sections = require('../config/sections');
const format = require('./utils/format');
const { optionalAdmin } = require('./middleware/auth');

function createApp() {
  const app = express();
  const started = Date.now();

  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"], // the editor needs inline styles
          'img-src': ["'self'", 'data:', 'https:'], // cover images can come from any https site
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'object-src': ["'none'"],
          'frame-ancestors': ["'self'"],
          'form-action': ["'self'"],
          'upgrade-insecure-requests': config.isProd ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    })
  );
  app.use(compression());
  app.use(
    express.static(path.join(__dirname, '..', 'public'), {
      maxAge: config.isProd ? '30d' : 0,
      etag: true,
    })
  );
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));
  app.use(cookieParser());
  app.use(optionalAdmin);

  // Values available in every template.
  app.use((req, res, next) => {
    const bySlug = Object.fromEntries(sections.map((s) => [s.slug, s]));
    Object.assign(res.locals, {
      siteTitle: config.siteTitle,
      siteTagline: config.siteTagline,
      siteUrl: config.siteUrl,
      adminBase: config.adminPath,
      sections,
      sectionBySlug: bySlug,
      currentPath: req.path,
      dateUr: format.dateUr,
      dateEn: format.dateEn,
      iso: format.iso,
      asset: (p) => `${p}?v=${started}`,
      postUrl: (p) => `/post/${p.id}${p.slug ? '/' + p.slug : ''}`,
      pageTitle: null,
      description: null,
      canonical: null,
      ogType: 'website',
      ogImage: '',
      robotsNoindex: false,
      bodyClass: '',
      htmlLang: 'ur',
      htmlDir: 'rtl',
    });
    next();
  });

  app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));

  app.use(config.adminPath, require('./routes/admin'));
  app.use('/', require('./routes/public'));

  app.use((req, res) => {
    res.status(404).render('error', { pageTitle: '404', code: 404, message: 'یہ صفحہ نہیں مل سکا۔' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).render('error', {
      pageTitle: 'Error',
      code: 500,
      message: 'کچھ خرابی پیش آ گئی ہے۔ براہِ کرم کچھ دیر بعد دوبارہ کوشش کریں۔',
    });
  });

  return app;
}

module.exports = { createApp };
