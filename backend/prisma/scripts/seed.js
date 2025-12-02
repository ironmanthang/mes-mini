const { PrismaClient, EmployeeStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
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

  console.log('Seeding initial admin user...');
  const adminUsername = 'admin';
  const adminPassword = 'changeme';

  const adminRole = await prisma.role.findUnique({
    where: { roleName: 'System Admin' },
  });

  if (adminRole) {
    const adminUser = await prisma.employee.upsert({
      where: { username: adminUsername },
      update: {
        // Ensure data stays consistent on re-runs
        status: EmployeeStatus.ACTIVE,
      },
      create: {
        fullName: 'Default Admin',
        username: adminUsername,
        password: await bcrypt.hash(adminPassword, 10),
        email: 'admin@example.com',
        phoneNumber: '000-000-0000',
        
        // --- NEW FIELDS ---
        dateOfBirth: new Date('1990-01-01'), // Default DOB for admin
        address: 'Admin HQ Address',         // Default address
        
        hireDate: new Date(),
        status: EmployeeStatus.ACTIVE,
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