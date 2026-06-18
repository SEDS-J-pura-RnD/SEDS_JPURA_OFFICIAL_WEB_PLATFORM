const { Client } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const connectionString = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Truncating public schema tables...");

  const tables = [
    'public.user_roles',
    'public.project_members',
    'public.news',
    'public.audit_logs',
    'public.accounts',
    'public.sessions',
    'public.users',
    'public.verifications',
    'public.projects',
    'public.event_registrations',
    'public.events',
    'public.certificates',
    'public.sponsors',
    'public.divisions',
    'public.roles',
    'public.permissions',
    'public.role_permissions'
  ];

  const query = `TRUNCATE TABLE ${tables.join(', ')} CASCADE;`;
  await client.query(query);
  console.log("Truncation complete!");

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
