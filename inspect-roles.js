const { Client } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const connectionString = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Checking users in neon_auth.user:");
  const users = await client.query("SELECT id, name, email FROM neon_auth.user;");
  console.table(users.rows);

  console.log("\nChecking all roles:");
  const roles = await client.query("SELECT id, name, \"isActive\" FROM public.roles;");
  console.table(roles.rows);

  console.log("\nChecking user_roles assignments:");
  const userRoles = await client.query(`
    SELECT ur."userId", u.name as "userName", u.email as "userEmail", ur."roleId", r.name as "roleName"
    FROM public.user_roles ur
    JOIN neon_auth.user u ON ur."userId" = u.id
    JOIN public.roles r ON ur."roleId" = r.id;
  `);
  console.table(userRoles.rows);

  console.log("\nChecking role permissions for 'Executive Committee Member':");
  const execPerms = await client.query(`
    SELECT p.name as "permissionName", p.category
    FROM public.role_permissions rp
    JOIN public.roles r ON rp."roleId" = r.id
    JOIN public.permissions p ON rp."permissionId" = p.id
    WHERE r.name = 'Executive Committee Member';
  `);
  console.table(execPerms.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
