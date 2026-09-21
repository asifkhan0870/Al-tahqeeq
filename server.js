const config = require('./src/config'); // validates .env first
const { initDb, pool } = require('./src/db');
const { createApp } = require('./src/app');

async function main() {
  try {
    await initDb(); // creates the tables if they do not exist yet
  } catch (err) {
    console.error('\n  Could not connect to the database.');
    console.error('  Check DATABASE_URL in your .env file.');
    console.error('  Details: ' + err.message + '\n');
    process.exit(1);
  }
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`\n  Site is running:  ${config.siteUrl}`);
    console.log(`  Admin panel:      ${config.siteUrl}${config.adminPath}\n`);
  });
  const stop = () => server.close(() => pool.end().then(() => process.exit(0)));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

main();
