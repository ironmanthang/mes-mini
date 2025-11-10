const jwt = require('jsonwebtoken');
const EmployeeService = require('../services/employeeService');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await EmployeeService.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
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

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !roles.some(role => req.user.roles.includes(role))) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this route' });
    }
    next();
  };
};

module.exports = { protect, authorize };