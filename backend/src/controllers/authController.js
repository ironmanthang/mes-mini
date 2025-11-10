const AuthService = require('../services/authService');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await AuthService.login(username, password);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json(req.user);
};