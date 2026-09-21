// PostgreSQL connection + automatic table creation.
const { Pool } = require('pg');

function buildPoolConfig() {
  const raw = process.env.DATABASE_URL;
  let connectionString = raw;
  let sslFromUrl = false;
  let host = '';

  try {
    const u = new URL(raw);
    host = u.hostname;
    const mode = u.searchParams.get('sslmode');
    if (mode && mode !== 'disable') sslFromUrl = true;
    // We control SSL ourselves below, so remove it from the link.
    u.searchParams.delete('sslmode');
    connectionString = u.toString();
  } catch (_) {
    /* keep the raw string if it cannot be parsed */
  }

  const isLocal = ['localhost', '127.0.0.1', '::1', ''].includes(host);
  let useSsl;
  if (process.env.DATABASE_SSL === 'true') useSsl = true;
  else if (process.env.DATABASE_SSL === 'false') useSsl = false;
  else useSsl = sslFromUrl || !isLocal; // cloud databases need SSL, local ones do not

  return {
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(buildPoolConfig());
pool.on('error', (err) => console.error('Unexpected database error:', err.message));

const query = (text, params) => pool.query(text, params);

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      id            SERIAL PRIMARY KEY,
      title         TEXT        NOT NULL,
      slug          TEXT        NOT NULL DEFAULT '',
      section       TEXT        NOT NULL,
      lang          TEXT        NOT NULL DEFAULT 'ur',
      excerpt       TEXT        NOT NULL DEFAULT '',
      content       TEXT        NOT NULL DEFAULT '',
      cover_url     TEXT        NOT NULL DEFAULT '',
      download_url  TEXT        NOT NULL DEFAULT '',
      status        TEXT        NOT NULL DEFAULT 'published',
      views         INTEGER     NOT NULL DEFAULT 0,
      read_min      INTEGER     NOT NULL DEFAULT 1,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await query('CREATE INDEX IF NOT EXISTS posts_section_idx ON posts (section, status, created_at DESC);');
  await query('CREATE INDEX IF NOT EXISTS posts_created_idx ON posts (status, created_at DESC);');
}

module.exports = { pool, query, initDb };
