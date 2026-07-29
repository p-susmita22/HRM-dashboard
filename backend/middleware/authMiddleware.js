import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await Employee.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      if (req.user.role === 'employee' && !req.user.isActive) {
        return res.status(401).json({ message: 'Account deactivated' });
      }
      
      if (req.user.role === 'employee') {
        if (req.user.activeDesktopToken !== token && req.user.activeMobileToken !== token) {
           return res.status(401).json({ message: 'Session expired or logged in from another device' });
        }
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

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
