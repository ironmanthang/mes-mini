const EmployeeService = require('../services/employeeService');

exports.createUser = async (req, res) => {
  try {
    const employee = await EmployeeService.createUser(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await EmployeeService.getAllEmployees();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await EmployeeService.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    // We pass req.user (the admin) to the service to check for self-admin-removal
    const employee = await EmployeeService.updateEmployeeByAdmin(req.params.id, req.body, req.user);
    res.status(200).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'TERMINATED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    const employee = await EmployeeService.updateStatus(req.params.id, status);
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
    try {
        await EmployeeService.deleteEmployeeHard(req.params.id);
        res.status(200).json({ message: 'Employee permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};