const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

const COOKIE = 'admin_session';

// Constant-time comparison (hides how many characters were correct).
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function checkPassword(input) {
  return typeof input === 'string' && safeEqual(input, config.adminPassword);
}

function readSession(req) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (_) {
    return null;
  }
}

function startSession(res, remember) {
  const csrf = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign({ sub: 'admin', csrf }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: remember ? '30d' : '12h',
  });
  const opts = {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    path: '/',
  };
  if (remember) opts.maxAge = 30 * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE, token, opts);
}

function endSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: config.cookieSecure, path: '/' });
}

// Runs on every request: works out whether the visitor is the admin.
function optionalAdmin(req, res, next) {
  const s = readSession(req);
  req.admin = s;
  res.locals.isAdmin = !!s;
  res.locals.csrf = s ? s.csrf : '';
  next();
}

function requireAdmin(req, res, next) {
  if (!req.admin) return res.redirect(config.adminPath + '/login');
  next();
}

// Every admin form carries a hidden token; this rejects forged requests.
function verifyCsrf(req, res, next) {
  const token = req.body && req.body._csrf;
  if (!req.admin || typeof token !== 'string' || !safeEqual(token, req.admin.csrf)) {
    return res.status(403).render('error', {
      pageTitle: 'Session expired',
      code: 403,
      message: 'اس فارم کی سیشن مدت ختم ہو گئی ہے۔ براہِ کرم صفحہ دوبارہ کھول کر کوشش کریں۔',
    });
  }
  next();
}

module.exports = { optionalAdmin, requireAdmin, verifyCsrf, checkPassword, startSession, endSession };
