// Reads and validates the settings from the .env file (or from the hosting
// provider's "Environment Variables" screen). If something important is
// missing, the server stops immediately with a clear message instead of
// failing in a confusing way later.
require('dotenv').config({ quiet: true });

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const errors = [];

if (!env.DATABASE_URL) {
  errors.push('DATABASE_URL is missing. Put your PostgreSQL connection link in .env (see README, step 3).');
}
if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 8) {
  errors.push('ADMIN_PASSWORD is missing or shorter than 8 characters. Choose a long, private password.');
}
if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  errors.push('JWT_SECRET is missing or shorter than 32 characters. Run "npm run gen-secret" and paste the result into .env.');
}
const weak = ['change-me', 'changeme', 'password', '12345678', 'admin123', 'your-strong-password-here'];
if (env.ADMIN_PASSWORD && weak.includes(env.ADMIN_PASSWORD.toLowerCase())) {
  errors.push('ADMIN_PASSWORD is a well-known weak password. Please choose a different one.');
}

let adminPath = (env.ADMIN_PATH || '/admin').trim();
if (!adminPath.startsWith('/')) adminPath = '/' + adminPath;
adminPath = adminPath.replace(/\/+$/, '');
if (!/^\/[a-zA-Z0-9_\-\/]+$/.test(adminPath)) {
  errors.push('ADMIN_PATH may only contain letters, numbers, "-" and "_" (example: /admin or /my-secret-panel).');
}

if (errors.length) {
  console.error('\n  Cannot start the site. Please fix these settings first:\n');
  errors.forEach((e) => console.error('   - ' + e));
  console.error('\n  Settings live in the .env file (copy .env.example to .env).\n');
  process.exit(1);
}

const port = parseInt(env.PORT, 10) || 3000;

let trustProxy = env.TRUST_PROXY;
if (trustProxy === undefined || trustProxy === '') trustProxy = isProd ? 1 : false;
else if (/^\d+$/.test(trustProxy)) trustProxy = parseInt(trustProxy, 10);
else if (trustProxy === 'true') trustProxy = true;
else if (trustProxy === 'false') trustProxy = false;

module.exports = {
  isProd,
  port,
  siteUrl: (env.SITE_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
  siteTitle: env.SITE_TITLE || 'علمی و تحقیقی بلاگ',
  siteTagline: env.SITE_TAGLINE || 'قرآن، حدیث اور فکری مباحث پر تحقیقی تحریریں',
  adminPath,
  adminPassword: env.ADMIN_PASSWORD,
  jwtSecret: env.JWT_SECRET,
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,
  trustProxy,
  perPage: 10,
  adminPerPage: 20,
};
