import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as bcrypt from "bcryptjs";
import { PERMISSION_CATEGORIES, PERMISSIONS } from "../lib/permissions";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

neonConfig.webSocketConstructor = ws;

const connectionString = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Seed Divisions
  const divisions = [
    {
      name: "IT and Satellite Division",
      slug: "it-satellite",
      description: "Satellite communication systems, embedded hardware, ground stations, and data processing.",
      icon: "🛰️",
      color: "#38bdf8",
    },
    {
      name: "Rocketry Division",
      slug: "rocketry",
      description: "Rocket propulsion, aerodynamics, flight simulation, and launch systems.",
      icon: "🚀",
      color: "#ef4444",
    },
    {
      name: "Rover and Robotics Division",
      slug: "rover-robotics",
      description: "Autonomous rovers, navigation, control systems, and robotic hardware integration.",
      icon: "🤖",
      color: "#10b981",
    },
    {
      name: "Biomedical Division",
      slug: "biomedical",
      description: "Space medicine, life support systems, human space research, and bio-sensors.",
      icon: "🧬",
      color: "#ec4899",
    },
    {
      name: "Observation Division",
      slug: "observation",
      description: "Astronomy, telescope systems, astrophysics, and celestial data observation.",
      icon: "🔭",
      color: "#f59e0b",
    },
  ];

  console.log("Seeding divisions...");
  for (const div of divisions) {
    await prisma.division.upsert({
      where: { slug: div.slug },
      update: div,
      create: div,
    });
  }

  // 2. Seed Permissions
  console.log("Seeding permissions...");
  const seededPermissions: Record<string, any> = {};

  for (const [category, permList] of Object.entries(PERMISSION_CATEGORIES)) {
    for (const permName of permList) {
      const dbPerm = await prisma.permission.upsert({
        where: { name: permName },
        update: { category },
        create: {
          name: permName,
          category,
          description: `Permission to perform ${permName.toLowerCase().replace(/_/g, " ")}`,
        },
      });
      seededPermissions[permName] = dbPerm;
    }
  }

  // 3. Seed Roles
  console.log("Seeding roles...");

  // Admin Role (all permissions)
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "Administrator with complete access to all system functions",
      isActive: true,
    },
  });

  // Assign all permissions to Admin
  console.log("Assigning all permissions to Admin role...");
  for (const dbPerm of Object.values(seededPermissions)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: dbPerm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: dbPerm.id,
      },
    });
  }

  // Other standard roles
  const otherRoles = [
    {
      name: "Executive Committee Member",
      description: "SEDS Executive Committee member with content publishing permissions",
      permissions: [
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.CREATE_NEWS,
        PERMISSIONS.EDIT_NEWS,
        PERMISSIONS.PUBLISH_NEWS,
        PERMISSIONS.CREATE_EVENT,
        PERMISSIONS.EDIT_EVENT,
        PERMISSIONS.MANAGE_EVENTS,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.EDIT_PROJECT,
        PERMISSIONS.ASSIGN_PROJECT_MEMBER,
        PERMISSIONS.ISSUE_CERTIFICATE,
      ],
    },
    {
      name: "Manager Board Member",
      description: "SEDS Manager Board member with basic management permissions",
      permissions: [
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.CREATE_NEWS,
        PERMISSIONS.EDIT_NEWS,
        PERMISSIONS.CREATE_EVENT,
        PERMISSIONS.EDIT_EVENT,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.EDIT_PROJECT,
      ],
    },
    {
      name: "Project Lead",
      description: "Leader of an R&D project with permissions to manage their project and members",
      permissions: [
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.EDIT_PROJECT,
        PERMISSIONS.ASSIGN_PROJECT_MEMBER,
      ],
    },
    {
      name: "Member",
      description: "Standard SEDS internal member",
      permissions: [
        PERMISSIONS.VIEW_ALL_PROJECTS,
      ],
    },
  ];

  for (const r of otherRoles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: {
        name: r.name,
        description: r.description,
        isActive: true,
      },
    });

    for (const permName of r.permissions) {
      const perm = seededPermissions[permName];
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }

  // 4. Seed Default Admin User
  console.log("Seeding default administrator user...");
  const adminEmail = "admin@sedsjpura.org.lk";
  const adminPassword = "seds-jpura-admin-pass";
  const { auth } = await import("../lib/auth");
  const authCtx = await auth.$context;
  const hashedPassword = await authCtx.password.hash(adminPassword);

  // Check if admin user already exists
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: "SEDS Admin",
        email: adminEmail,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
      },
    });

    // Create credential account for Better Auth
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    console.log(`Created new Admin User: ${adminEmail}`);
  }

  // Assign Admin role to Admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
