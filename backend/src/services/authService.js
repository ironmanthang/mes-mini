const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

class AuthService {
  async login(username, password) {
    const employee = await prisma.employee.findUnique({ where: { username } });
    if (!employee || !(await bcrypt.compare(password, employee.password))) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign(
      { id: employee.employeeId, username: employee.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return token;
  }
}

module.exports = new AuthService();