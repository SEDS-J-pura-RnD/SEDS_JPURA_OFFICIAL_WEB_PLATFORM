/**
 * CLI utility to reset a member's password.
 * Usage: node reset-password.js <email> <newPassword>
 * Example: node reset-password.js member@sedsjpura.org.lk NewSecurePass123!
 */

const { Client } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node reset-password.js <email> <newPassword>");
    console.error("Example: node reset-password.js member@sedsjpura.org.lk Pass123456");
    process.exit(1);
  }

  const email = args[0].trim().toLowerCase();
  const newPassword = args[1];

  if (newPassword.length < 8) {
    console.error("Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  const connectionString = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
  if (!connectionString) {
    console.error("Error: DATABASE_URL not found in .env.local.");
    process.exit(1);
  }

  console.log(`Connecting to Neon database...`);
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // 1. Locate the user
    const userRes = await client.query(
      `SELECT id, name, email FROM neon_auth.user WHERE LOWER(email) = $1 LIMIT 1;`,
      [email]
    );

    if (userRes.rows.length === 0) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    const user = userRes.rows[0];
    console.log(`Found member: ${user.name} (${user.email}, ID: ${user.id})`);

    // 2. Hash the new password using Better Auth's scrypt hasher
    console.log("Generating secure scrypt password hash...");
    const { betterAuth } = await import("better-auth");
    const tempAuth = betterAuth({
      database: { provider: "sqlite", db: {} },
      emailAndPassword: { enabled: true },
    });
    const authCtx = await tempAuth.$context;
    const hashedPassword = await authCtx.password.hash(newPassword);

    // 3. Check for existing credential account
    const accountRes = await client.query(
      `SELECT id FROM neon_auth.account WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1;`,
      [user.id]
    );

    if (accountRes.rows.length > 0) {
      await client.query(
        `UPDATE neon_auth.account SET password = $1, "updatedAt" = NOW() WHERE id = $2;`,
        [hashedPassword, accountRes.rows[0].id]
      );
      console.log(`Updated existing credential password for ${user.email}.`);
    } else {
      const crypto = await import("crypto");
      const accountId = crypto.randomUUID();
      await client.query(
        `INSERT INTO neon_auth.account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, $2, 'credential', $3, NOW(), NOW());`,
        [accountId, user.id, hashedPassword]
      );
      console.log(`Created new credential account with password for ${user.email}.`);
    }

    console.log(`\nPassword reset successfully! The member can now log in with:`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${newPassword}\n`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed to reset password:", err);
  process.exit(1);
});
