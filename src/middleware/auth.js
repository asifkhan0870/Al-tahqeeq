// src/middleware/auth.js

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

const COOKIE = 'admin_session';

// ------------------------------------------------------------
// Constant-time comparison
// ------------------------------------------------------------

function safeEqual(a, b) {
  const ha = crypto
    .createHash('sha256')
    .update(String(a))
    .digest();

  const hb = crypto
    .createHash('sha256')
    .update(String(b))
    .digest();

  return crypto.timingSafeEqual(ha, hb);
}

// ------------------------------------------------------------
// Credentials
// ------------------------------------------------------------

function checkCredentials(username, password) {
  if (
    typeof username !== 'string' ||
    typeof password !== 'string'
  ) {
    return false;
  }

  return (
    safeEqual(username.trim(), config.adminUsername) &&
    safeEqual(password, config.adminPassword)
  );
}

// ------------------------------------------------------------
// Session
// ------------------------------------------------------------

function readSession(req) {
  const token = req.cookies && req.cookies[COOKIE];

  if (!token) return null;

  try {
    const session = jwt.verify(
      token,
      config.jwtSecret,
      {
        algorithms: ['HS256'],
      }
    );

    if (
      !session ||
      session.sub !== 'admin' ||
      typeof session.csrf !== 'string'
    ) {
      return null;
    }

    return session;
  } catch (_) {
    return null;
  }
}

// ------------------------------------------------------------
// Start session
// ------------------------------------------------------------

function startSession(res, remember) {
  const csrf = crypto
    .randomBytes(32)
    .toString('hex');

  const token = jwt.sign(
    {
      sub: 'admin',
      csrf,
      username: config.adminUsername,
    },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: remember ? '30d' : '12h',
    }
  );

  const options = {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    path: '/',
  };

  if (remember) {
    options.maxAge =
      30 * 24 * 60 * 60 * 1000;
  }

  res.cookie(COOKIE, token, options);
}

// ------------------------------------------------------------
// End session
// ------------------------------------------------------------

function endSession(res) {
  res.clearCookie(COOKIE, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    path: '/',
  });
}

// ------------------------------------------------------------
// Optional authentication
// ------------------------------------------------------------

function optionalAdmin(req, res, next) {
  const session = readSession(req);

  req.admin = session;

  res.locals.isAdmin = !!session;

  res.locals.adminUsername =
    session && session.username
      ? session.username
      : '';

  res.locals.csrf =
    session && session.csrf
      ? session.csrf
      : '';

  next();
}

// ------------------------------------------------------------
// Required authentication
// ------------------------------------------------------------

function requireAdmin(req, res, next) {
  if (!req.admin) {
    return res.redirect(
      config.adminPath + '/login'
    );
  }

  next();
}

// ------------------------------------------------------------
// CSRF verification
// ------------------------------------------------------------

function verifyCsrf(req, res, next) {
  const token =
    req.body && req.body._csrf;

  if (
    !req.admin ||
    typeof token !== 'string' ||
    !safeEqual(token, req.admin.csrf)
  ) {
    return res.status(403).render(
      'error',
      {
        pageTitle: 'Session expired',
        code: 403,
        message:
          'اس فارم کی سیشن مدت ختم ہو گئی ہے۔ براہِ کرم صفحہ دوبارہ کھول کر کوشش کریں۔',
      }
    );
  }

  next();
}

module.exports = {
  optionalAdmin,
  requireAdmin,
  verifyCsrf,
  checkCredentials,
  startSession,
  endSession,
};