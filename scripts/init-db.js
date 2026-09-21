// Optional: creates the tables without starting the site.  Run:  npm run init-db
require('../src/config');
const { initDb, pool } = require('../src/db');
initDb()
  .then(() => console.log('Database is ready (tables created).'))
  .catch((e) => { console.error('Failed:', e.message); process.exitCode = 1; })
  .finally(() => pool.end());
