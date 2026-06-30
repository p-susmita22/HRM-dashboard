import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
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

    if (employee.role === 'employee' && employee.isActive) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate = new Date(employee.joiningDate || employee.createdAt);
      startDate.setHours(0, 0, 0, 0);

      // Cap startDate to at most 30 days ago to prevent excessive checking
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      if (startDate < thirtyDaysAgo) {
        startDate = thirtyDaysAgo;
      }

      // Fetch all attendance for this employee in the range
      const attendances = await Attendance.find({
        employee: employee._id,
        date: { $gte: startDate, $lt: today }
      });

      // Fetch all holidays in the range
      const holidays = await Attendance.find({
        status: 'Holiday',
        date: { $gte: startDate, $lt: today }
      });
      const holidayDates = new Set(holidays.map(h => new Date(h.date).toDateString()));

      // Fetch all approved leaves for this employee
      const leaves = await Leave.find({
        employee: employee._id,
        status: 'Approved'
      });

      let hasUnauthorizedAbsence = false;
      let currentDate = new Date(startDate);

      while (currentDate < today) {
        if (currentDate.getDay() !== 0 && !holidayDates.has(currentDate.toDateString())) {
          // Check if they have an attendance record
          const att = attendances.find(a => new Date(a.date).toDateString() === currentDate.toDateString());
          
          const hasPunchedIn = att && att.punchIn;
          
          if (!hasPunchedIn && (!att || att.status === 'Absent')) {
            // Check if they were on leave
            const cTime = currentDate.getTime();
            const isOnLeave = leaves.some(l => {
              if (l.dates && l.dates.length > 0) {
                return l.dates.some(d => new Date(d).setHours(0,0,0,0) === cTime);
              }
              const start = new Date(l.fromDate).setHours(0,0,0,0);
              const end = new Date(l.toDate).setHours(23,59,59,999);
              return cTime >= start && cTime <= end;
            });

            if (!isOnLeave) {
              hasUnauthorizedAbsence = true;
              break;
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (hasUnauthorizedAbsence) {
        employee.isActive = false;
        await employee.save();
        return res.status(403).json({ message: 'Account has been automatically deactivated due to unauthorized absence. Please contact Admin.' });
      }
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
