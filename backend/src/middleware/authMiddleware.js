const jwt = require('jsonwebtoken');
const EmployeeService = require('../services/employeeService');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await EmployeeService.findById(decoded.id);

      // 1. Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // 2. [NEW] Check if user is active
      // This prevents terminated employees from using old tokens
      if (req.user.status !== 'ACTIVE') {
        return res.status(403).json({ message: 'Access denied. Account is not active.' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Forbidden: No roles assigned' });
    }

    // 2. Check if ANY of the user's roles match ANY of the allowed roles
    // FIX: Use 'userRole.roleName' because that is what EmployeeService returns.
    const hasPermission = req.user.roles.some(userRole => 
      allowedRoles.includes(userRole.roleName)
    );

    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this route' });
    }
    next();
  };
};

module.exports = { protect, authorize };