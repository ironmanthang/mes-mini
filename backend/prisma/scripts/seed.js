const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // --- 1. SEED THE ROLES (You already have this) ---
  console.log('Seeding roles...');
  const roles = [
    'System Admin',
    'Production Manager',
    'Warehouse Keeper',
    'Line Leader',
    'Production Worker',
    'Sales Staff',
  ];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }
  console.log('Roles seeded successfully.');


  // --- 2. SEED THE INITIAL ADMIN USER (This is the new part) ---
  console.log('Seeding initial admin user...');
  const adminUsername = 'admin';
  const adminPassword = 'changeme'; // Use a known, temporary password

  // Find the 'System Admin' role we just created
  const adminRole = await prisma.role.findUnique({
    where: { roleName: 'System Admin' },
  });

  if (adminRole) {
    // Use upsert to avoid creating the admin twice if the script is run again
    const adminUser = await prisma.employee.upsert({
      where: { username: adminUsername },
      update: {},
      create: {
        fullName: 'Default Admin',
        username: adminUsername,
        password: await bcrypt.hash(adminPassword, 10),
        roles: {
          create: {
            roleId: adminRole.roleId,
          },
        },
      },
    });
    console.log(`Initial admin user '${adminUser.username}' seeded successfully.`);
  } else {
    console.error('"System Admin" role not found. Could not seed admin user.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });