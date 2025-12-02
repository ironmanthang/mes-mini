const AuthService = require('../services/authService');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const { token, user } = await AuthService.login(username, password);
    
    // [NEW] Send both back to the client
    res.status(200).json({ 
      message: 'Login: successful',
      token, 
      user 
    });
  } catch (error) {
    if (error.message === 'Username and password are required') {
        return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Invalid credentials' || error.message.includes('Account is inactive')) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  // Destructure to be explicit. This acts as a final firewall.
  const { 
    employeeId, fullName, username, email, 
    phoneNumber, address, dateOfBirth, 
    hireDate, status, roles 
  } = req.user;

  res.status(200).json({
    employeeId,
    fullName,
    username,
    email,
    phoneNumber,
    address,
    dateOfBirth,
    hireDate,
    status,
    roles
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const updatedUser = await AuthService.updateProfile(req.user.employeeId, req.body);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    await AuthService.changePassword(req.user.employeeId, currentPassword, newPassword);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};