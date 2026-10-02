// src/config.js
// Application configuration loaded from .env

require('dotenv').config({ quiet: true });

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const errors = [];

// ------------------------------------------------------------
// Required environment variables
// ------------------------------------------------------------

if (!env.DATABASE_URL) {
  errors.push(
    'DATABASE_URL is missing. Put your PostgreSQL connection link in .env.'
  );
}

if (!env.ADMIN_USERNAME || env.ADMIN_USERNAME.trim().length < 3) {
  errors.push(
    'ADMIN_USERNAME is missing or shorter than 3 characters.'
  );
}

if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 8) {
  errors.push(
    'ADMIN_PASSWORD is missing or shorter than 8 characters.'
  );
}

if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  errors.push(
    'JWT_SECRET is missing or shorter than 32 characters. Run "npm run gen-secret".'
  );
}

const weakPasswords = [
  'change-me',
  'changeme',
  'password',
  '12345678',
  'admin123',
  'your-strong-password-here',
];

if (
  env.ADMIN_PASSWORD &&
  weakPasswords.includes(env.ADMIN_PASSWORD.toLowerCase())
) {
  errors.push(
    'ADMIN_PASSWORD is a well-known weak password. Choose a different one.'
  );
}

// ------------------------------------------------------------
// Admin path
// ------------------------------------------------------------

let adminPath = (env.ADMIN_PATH || '/admin').trim();

if (!adminPath.startsWith('/')) {
  adminPath = '/' + adminPath;
}

adminPath = adminPath.replace(/\/+$/, '');

if (!/^\/[a-zA-Z0-9_\-/]+$/.test(adminPath)) {
  errors.push(
    'ADMIN_PATH may only contain letters, numbers, "-", "_" and "/"'
  );
}

// ------------------------------------------------------------
// Stop startup if configuration is invalid
// ------------------------------------------------------------

if (errors.length) {
  console.error('\n  Cannot start the site. Please fix these settings:\n');

  errors.forEach((error) => {
    console.error('   - ' + error);
  });

  console.error(
    '\n  Settings live in the .env file.\n'
  );

  process.exit(1);
}

// ------------------------------------------------------------
// General configuration
// ------------------------------------------------------------

const port = parseInt(env.PORT, 10) || 3000;

let trustProxy = env.TRUST_PROXY;

if (trustProxy === undefined || trustProxy === '') {
  trustProxy = isProd ? 1 : false;
} else if (/^\d+$/.test(trustProxy)) {
  trustProxy = parseInt(trustProxy, 10);
} else if (trustProxy === 'true') {
  trustProxy = true;
} else if (trustProxy === 'false') {
  trustProxy = false;
}

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = {
  isProd,

  port,

  siteUrl: (
    env.SITE_URL || `http://localhost:${port}`
  ).replace(/\/+$/, ''),

  siteTitle:
    env.SITE_TITLE ||
    'القول المبين في اختلاف بين المسلمين',

  siteTagline:
    env.SITE_TAGLINE ||
    'قرآن، حدیث اور فکری مباحث پر تحقیقی تحریریں',

  adminPath,

  // NEW
  adminUsername: env.ADMIN_USERNAME.trim(),

  adminPassword: env.ADMIN_PASSWORD,

  jwtSecret: env.JWT_SECRET,

  cookieSecure:
    env.COOKIE_SECURE
      ? env.COOKIE_SECURE === 'true'
      : isProd,

  trustProxy,

  perPage: 10,

  adminPerPage: 20,

  // Upload settings
  uploadMaxBytes:
    parseInt(env.UPLOAD_MAX_BYTES, 10) ||
    5 * 1024 * 1024,
};