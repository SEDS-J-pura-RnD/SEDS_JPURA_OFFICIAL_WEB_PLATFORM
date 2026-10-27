const { Client } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const connectionString = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
  if (!connectionString) {
    console.error("Error: DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log("Creating public.site_settings table if it does not exist...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Table public.site_settings is ready!");
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
