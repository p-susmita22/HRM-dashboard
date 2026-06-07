import Employee from '../models/Employee.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await Employee.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (employee.isLocked) {
      return res.status(403).json({ message: 'Your ID has been locked by your HR due to continuous absence. Please contact him/her immediately.' });
    }

    if (!employee.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    if (await employee.matchPassword(password)) {
      // Record login activity
      const device = req.headers['user-agent'] || 'Unknown Device';
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
      
      employee.loginActivity.push({
        device,
        ip,
        loginTime: new Date()
      });
      
      // Keep only last 5 logins
      if (employee.loginActivity.length > 5) {
        employee.loginActivity.shift();
      }
      
      await employee.save();

      res.json({
        _id: employee._id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
        token: generateToken(employee._id, employee.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingAdmin = await Employee.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const employeeId = 'ADMIN-' + Math.floor(1000 + Math.random() * 9000);

    const admin = await Employee.create({
      employeeId,
      fullName,
      email,
      password,
      phoneNumber: 'N/A',
      department: 'Management',
      designation: 'Administrator',
      joiningDate: new Date(),
      role: 'admin',
    });

    if (admin) {
      res.status(201).json({
        _id: admin._id,
        employeeId: admin.employeeId,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id, admin.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
