import Admin from '../models/Admin.js';
import User from '../models/User.js';

// Remove jwt import and token generation function

export const adminRegister = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) return res.status(400).json({ msg: 'Please fill all fields' });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ msg: 'Admin already exists' });

    const newAdmin = new Admin({ username, email, password, role });
    await newAdmin.save();

    // Store user info in session
    req.session.user = {
      id: newAdmin._id,
      username: newAdmin.username,
      email: newAdmin.email,
      role: newAdmin.role
    };

    res.status(201).json({ user: req.session.user });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ msg: 'Please fill all fields' });

    const admin = await Admin.findOne({ email });
    if(!admin) return res.status(404).json({ msg: 'Admin not found' });

    const isMatch = await admin.comparePassword(password);
    if(!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // Store user info in session
    req.session.user = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    };

    res.json({ user: req.session.user });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const userRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if(!username || !email || !password) return res.status(400).json({ msg: 'Please fill all fields' });

    const existingUser = await User.findOne({ email });
    if(existingUser) return res.status(400).json({ msg: 'User already exists' });

    const newUser = new User({ username, email, password });
    await newUser.save();

    // Store user info in session
    req.session.user = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: 'user'
    };

    res.status(201).json({ user: req.session.user });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ msg: 'Please fill all fields' });

    const user = await User.findOne({ email });
    if(!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if(!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // Store user info in session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: 'user'
    };

    res.json({ user: req.session.user });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ msg: 'Failed to logout' });
    res.clearCookie('connect.sid'); // Clear session cookie
    res.json({ msg: 'Logged out successfully' });
  });
};