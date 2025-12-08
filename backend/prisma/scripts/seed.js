// scripts/seed.js
const { PrismaClient, EmployeeStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ============================================================================
// 🎛️ CENTRAL CONTROL PANEL
// Toggle these to TRUE/FALSE to control what gets seeded
// ============================================================================
const SEED_CONFIG = {
  ROLES: true,      // Required for Employees
  EMPLOYEES: true,  // Creates Admin, Manager, Purchaser, Keeper
  SUPPLIERS: true,  // Creates Vendors
  COMPONENTS: true, // Creates Raw Materials
  RELATIONS: true,  // Links Components to Suppliers (The Catalog)
};

// Common Password for everyone: '123456'
const DEFAULT_PASSWORD = '123456'; 

async function main() {
  console.log('🌱 Starting Seeding Process...');

  if (SEED_CONFIG.ROLES) await seedRoles();
  if (SEED_CONFIG.EMPLOYEES) await seedEmployees();
  if (SEED_CONFIG.SUPPLIERS) await seedSuppliers();
  if (SEED_CONFIG.COMPONENTS) await seedComponents();
  if (SEED_CONFIG.RELATIONS) await seedSupplierComponents();

  console.log('✅ Seeding Completed.');
}

// ============================================================================
// 1. SEED ROLES
// ============================================================================
async function seedRoles() {
  console.log('...Seeding Roles');
  const roles = [
    'System Admin',
    'Production Manager',
    'Warehouse Keeper',
    'Line Leader',
    'Production Worker',
    'Sales Staff',
    'Purchasing Staff'
  ];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }
}

// ============================================================================
// 2. SEED EMPLOYEES (The Personas)
// ============================================================================
async function seedEmployees() {
  console.log('...Seeding Employees');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const users = [
    {
      name: 'Super Admin', username: 'admin', email: 'admin@mes.com',
      role: 'System Admin'
    },
    {
      name: 'Mr. Manager', username: 'manager', email: 'manager@mes.com',
      role: 'Production Manager' // For Step A.2 (Approval)
    },
    {
      name: 'Ms. Purchaser', username: 'purchaser', email: 'buy@mes.com',
      role: 'Purchasing Staff' // For Step A.2 (Creation)
    },
    {
      name: 'Mr. Keeper', username: 'keeper', email: 'warehouse@mes.com',
      role: 'Warehouse Keeper' // For Step A.3 (Receipt)
    }
  ];

  for (const u of users) {
    // 1. Get Role ID
    const role = await prisma.role.findUnique({ where: { roleName: u.role } });
    if (!role) {
      console.warn(`⚠️ Role ${u.role} not found. Skipping user ${u.username}.`);
      continue;
    }

    // 2. Upsert User
    await prisma.employee.upsert({
      where: { username: u.username },
      update: { status: EmployeeStatus.ACTIVE },
      create: {
        fullName: u.name,
        username: u.username,
        password: hashedPassword,
        email: u.email,
        phoneNumber: `090000000${users.indexOf(u)}`, // Fake phone
        address: 'Factory Dormitory',
        dateOfBirth: new Date('1990-01-01'),
        hireDate: new Date(),
        status: EmployeeStatus.ACTIVE,
        roles: {
          create: { roleId: role.roleId }
        }
      }
    });
  }
}

// ============================================================================
// 3. SEED SUPPLIERS
// ============================================================================
async function seedSuppliers() {
  console.log('...Seeding Suppliers');
  const suppliers = [
    { code: 'SUP-HP', name: 'Hoa Phat Steel', email: 'sales@hoaphat.com', phone: '0901111111' },
    { code: 'SUP-SS', name: 'Samsung Electronics', email: 'b2b@samsung.com', phone: '0902222222' },
    { code: 'SUP-LG', name: 'Logistics Global', email: 'contact@lg.com', phone: '0903333333' }
  ];

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code: s.code,
        supplierName: s.name,
        email: s.email,
        phoneNumber: s.phone,
        address: 'Industrial Zone'
      }
    });
  }
}

// ============================================================================
// 4. SEED COMPONENTS
// ============================================================================
async function seedComponents() {
  console.log('...Seeding Components');
  const components = [
    { code: 'COM-STEEL-5MM', name: 'Steel Sheet 5mm', unit: 'kg', cost: 45000, stock: 100 },
    { code: 'COM-STEEL-10MM', name: 'Steel Sheet 10mm', unit: 'kg', cost: 85000, stock: 50 },
    { code: 'COM-CHIP-X1', name: 'Control Chip X1', unit: 'pcs', cost: 120000, stock: 500 },
    { code: 'COM-SCREW-M5', name: 'Screw M5', unit: 'pcs', cost: 500, stock: 10000 },
  ];

  for (const c of components) {
    await prisma.component.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        componentName: c.name,
        unit: c.unit,
        standardCost: c.cost,
        minStockLevel: c.stock
      }
    });
  }
}

// ============================================================================
// 5. SEED RELATIONS (Supplier <-> Component)
// ============================================================================
async function seedSupplierComponents() {
  console.log('...Linking Suppliers to Components');
  
  // Helper to find ID by code
  const getSup = async (code) => prisma.supplier.findUnique({ where: { code } });
  const getCom = async (code) => prisma.component.findUnique({ where: { code } });

  const hoaphat = await getSup('SUP-HP');
  const samsung = await getSup('SUP-SS');
  
  const steel5 = await getCom('COM-STEEL-5MM');
  const steel10 = await getCom('COM-STEEL-10MM');
  const chip = await getCom('COM-CHIP-X1');

  // Logic: Hoa Phat sells Steel, Samsung sells Chips
  const links = [
    { s: hoaphat, c: steel5 },
    { s: hoaphat, c: steel10 },
    { s: samsung, c: chip }
  ];

  for (const link of links) {
    if (link.s && link.c) {
      await prisma.supplierComponent.upsert({
        where: {
          supplierId_componentId: {
            supplierId: link.s.supplierId,
            componentId: link.c.componentId
          }
        },
        update: {},
        create: {
          supplierId: link.s.supplierId,
          componentId: link.c.componentId
        }
      });
    }
  }
}

// Execution
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });