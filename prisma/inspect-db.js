const { Client } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const connectionString = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Checking users in neon_auth.user...");
  const res = await client.query("SELECT id, name, email FROM neon_auth.user;");
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
