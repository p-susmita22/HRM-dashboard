import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import jwt from 'jsonwebtoken';

const extractDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  if (/android/i.test(userAgent)) {
    const match = userAgent.match(/Android.*?; ([a-zA-Z0-9\-_ ]+)/i);
    return match ? `Android (${match[1].trim()})` : 'Android';
  }
  if (/iphone/i.test(userAgent)) return 'iPhone';
  if (/ipad/i.test(userAgent)) return 'iPad';
  if (/windows/i.test(userAgent)) return 'Windows PC';
  if (/mac/i.test(userAgent)) return 'Mac';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Unknown Device';
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

export const loginEmployee = async (req, res) => {
  try {
    const { email, password, deviceId, deviceType, loginSource } = req.body;
    const isAdminPanelRequest = loginSource === 'admin-panel';

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
            // If this absence happened BEFORE the employee's last update (e.g. Admin reactivation), ignore it.
            // This prevents an infinite lockout loop where Admin reactivates them but the past absence blocks them again.
            if (currentDate.getTime() > new Date(employee.updatedAt).getTime()) {
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
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (hasUnauthorizedAbsence) {
        employee.isActive = false;
        employee.lockReason = 'Account inactive: Employee absent for multiple days without applying for leave or punching in.';
        await employee.save();
        return res.status(403).json({ message: 'Account has been automatically deactivated due to unauthorized absence. Please contact Admin.' });
      }
    }

    if (await employee.matchPassword(password)) {
      // If the request came from the admin login panel, do NOT allow employee login
      // and do NOT trigger any device locking — just reject with a role mismatch error.
      if (isAdminPanelRequest && employee.role !== 'admin') {
        return res.status(401).json({ message: 'Credentials does not match. Please use Employee Login.' });
      }

      if (employee.role === 'employee') {
        const userAgent = req.headers['user-agent'] || '';
        const isAndroid = /android/i.test(userAgent);
        const isWindows = /windows/i.test(userAgent);

        // Strict OS Rule: Only Android and Windows PC are allowed
        if (!isAndroid && !isWindows) {
          employee.isLocked = true;
          employee.lockReason = 'Account locked: Attempted to log in from an unauthorized OS (Not Android or Windows PC).';
          employee.lockedCount = (employee.lockedCount || 0) + 1;
          await employee.save();
          return res.status(403).json({ message: 'Account locked! You can only log in from 1 Android and 1 Windows PC. Other systems are not allowed.' });
        }

        if (deviceType === 'mobile') {
          if (employee.activeMobileId && employee.activeMobileId !== deviceId) {
            employee.isLocked = true;
            employee.lockReason = 'Account locked: Attempted to log in from a 2nd Android mobile (3rd system attempt).';
            employee.lockedCount = (employee.lockedCount || 0) + 1;
            employee.activeMobileToken = null;
            await employee.save();
            return res.status(403).json({ message: 'Account locked! You can only log in from 1 Android and 1 Windows PC. 3rd system login is not allowed.' });
          }
        } else {
          if (employee.activeDesktopId && employee.activeDesktopId !== deviceId) {
            employee.isLocked = true;
            employee.lockReason = 'Account locked: Attempted to log in from a 2nd Windows PC (3rd system attempt).';
            employee.lockedCount = (employee.lockedCount || 0) + 1;
            employee.activeDesktopToken = null;
            await employee.save();
            return res.status(403).json({ message: 'Account locked! You can only log in from 1 Android and 1 Windows PC. 3rd system login is not allowed.' });
          }
        }
      }

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
      
      const token = generateToken(employee._id, employee.role);
      const parsedDeviceName = extractDeviceName(device);

      if (employee.role === 'employee') {
        if (deviceType === 'mobile') {
          employee.activeMobileId = deviceId;
          employee.activeMobileToken = token;
          employee.activeMobileDeviceName = parsedDeviceName;
        } else {
          employee.activeDesktopId = deviceId;
          employee.activeDesktopToken = token;
          employee.activeDesktopDeviceName = parsedDeviceName;
        }
      }

      await employee.save();

      res.json({
        _id: employee._id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
        token,
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

export const logoutEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id);
    if (employee) {
      const { deviceType } = req.body;
      if (deviceType === 'mobile') {
        employee.activeMobileToken = null;
      } else {
        employee.activeDesktopToken = null;
      }
      await employee.save();
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
