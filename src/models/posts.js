// All database queries for posts live here.
const { query } = require('../db');

const LIST_COLUMNS = `id, title, slug, section, lang, excerpt, cover_url, status, views, read_min, created_at, updated_at`;

const escapeLike = (s) => s.replace(/[\\%_]/g, (m) => '\\' + m);

// Builds the WHERE part shared by list() and count.
function buildWhere({ section, status, q }) {
  const where = [];
  const params = [];
  if (section) { params.push(section); where.push(`section = $${params.length}`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  if (q) {
    params.push('%' + escapeLike(q) + '%');
    const n = params.length;
    where.push(`(title ILIKE $${n} OR excerpt ILIKE $${n} OR content ILIKE $${n})`);
  }
  return { sql: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

async function list({ section, status, q, page = 1, perPage = 10 } = {}) {
  const { sql, params } = buildWhere({ section, status, q });
  const totalRes = await query(`SELECT COUNT(*)::int AS n FROM posts ${sql}`, params);
  const total = totalRes.rows[0].n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const rows = (
    await query(
      `SELECT ${LIST_COLUMNS} FROM posts ${sql} ORDER BY created_at DESC, id DESC LIMIT ${perPage} OFFSET ${(current - 1) * perPage}`,
      params
    )
  ).rows;
  return { rows, total, page: current, pages };
}

async function get(id) {
  const r = await query('SELECT * FROM posts WHERE id = $1', [id]);
  return r.rows[0] || null;
}

async function create(d) {
  const r = await query(
    `INSERT INTO posts (title, slug, section, lang, excerpt, content, cover_url, download_url, status, read_min)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [d.title, d.slug, d.section, d.lang, d.excerpt, d.content, d.cover_url, d.download_url, d.status, d.read_min]
  );
  return r.rows[0].id;
}

async function update(id, d) {
  const r = await query(
    `UPDATE posts SET title=$1, slug=$2, section=$3, lang=$4, excerpt=$5, content=$6, cover_url=$7,
       download_url=$8, status=$9, read_min=$10, updated_at=now()
     WHERE id=$11`,
    [d.title, d.slug, d.section, d.lang, d.excerpt, d.content, d.cover_url, d.download_url, d.status, d.read_min, id]
  );
  return r.rowCount > 0;
}

async function remove(id) {
  const r = await query('DELETE FROM posts WHERE id = $1', [id]);
  return r.rowCount > 0;
}

async function setStatus(id, status) {
  const r = await query('UPDATE posts SET status=$1, updated_at=now() WHERE id=$2', [status, id]);
  return r.rowCount > 0;
}

async function addView(id) {
  await query('UPDATE posts SET views = views + 1 WHERE id = $1', [id]);
}

async function countsBySection() {
  const r = await query(`SELECT section, COUNT(*)::int AS n FROM posts WHERE status='published' GROUP BY section`);
  const out = {};
  r.rows.forEach((x) => (out[x.section] = x.n));
  return out;
}

async function stats() {
  const r = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status='published')::int AS published,
            COUNT(*) FILTER (WHERE status='draft')::int AS drafts,
            COALESCE(SUM(views),0)::int AS views
     FROM posts`
  );
  return r.rows[0];
}

async function related(post, limit = 3) {
  const r = await query(
    `SELECT ${LIST_COLUMNS} FROM posts WHERE status='published' AND section=$1 AND id<>$2
     ORDER BY created_at DESC LIMIT ${limit}`,
    [post.section, post.id]
  );
  return r.rows;
}

async function forSitemap() {
  return (await query(`SELECT id, slug, updated_at FROM posts WHERE status='published' ORDER BY id`)).rows;
}

module.exports = { list, get, create, update, remove, setStatus, addView, countsBySection, stats, related, forSitemap };
