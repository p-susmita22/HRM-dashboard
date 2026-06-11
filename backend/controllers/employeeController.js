import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';

export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id).select('-password');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const { docType } = req.body;
    const url = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;

    const employee = await Employee.findById(req.user._id);
    
    // Check if docType already exists and replace it, else push new
    const existingDocIndex = employee.documents.findIndex(d => d.docType === docType);
    if (existingDocIndex >= 0) {
      employee.documents[existingDocIndex] = { docType, url, fileName };
    } else {
      employee.documents.push({ docType, url, fileName });
    }

    await employee.save();
    
    res.json({ message: 'Document uploaded successfully', document: { docType, url, fileName } });
  } catch (error) {
    res.status(500).json({ message: 'Server error uploading document' });
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today }
    });
    
    res.json(attendance || null);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const punchIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today }
    });
    
    if (attendance) {
      return res.status(400).json({ message: 'Already punched in today' });
    }
    
    attendance = new Attendance({
      employee: req.user._id,
      date: new Date(),
      punchIn: new Date(),
      status: 'Present'
    });
    
    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const punchOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today }
    });
    
    if (!attendance || !attendance.punchIn) {
      return res.status(400).json({ message: 'Not punched in yet' });
    }
    
    if (attendance.punchOut) {
      return res.status(400).json({ message: 'Already punched out today' });
    }
    
    attendance.punchOut = new Date();
    
    // Calculate total hours
    const diff = attendance.punchOut - attendance.punchIn;
    attendance.totalHours = diff / (1000 * 60 * 60);
    
    // Check half day logic
    const punchInHour = attendance.punchIn.getHours();
    const punchOutHour = attendance.punchOut.getHours();
    const punchOutMinute = attendance.punchOut.getMinutes();
    
    let isHalfDay = false;
    
    // 1. Total working hours < 8
    if (attendance.totalHours < 8) {
      isHalfDay = true;
    }
    
    // 2. Punch in time 12:00 PM or after (>= 12)
    if (punchInHour >= 12) {
      isHalfDay = true;
    }
    
    // 3. Punch out time 1:30 PM (13:30) to 2:00 PM (14:00)
    if ((punchOutHour === 13 && punchOutMinute >= 30) || punchOutHour === 14) {
      isHalfDay = true;
    }
    
    if (isHalfDay) {
      attendance.status = 'Half Day';
    } else {
      attendance.status = 'Present';
    }
    
    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import Leave from '../models/Leave.js';

export const applyLeave = async (req, res) => {
  try {
    const { leaveType, dates, reason } = req.body;
    const dateArray = dates ? dates.split(',') : [];

    const leave = new Leave({
      employee: req.user._id,
      leaveType,
      dates: dateArray,
      reason,
      status: 'Pending'
    });
    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (leave.employee.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    if (leave.status !== 'Pending') return res.status(400).json({ message: 'Cannot delete processed leave' });
    
    await leave.deleteOne();
    res.json({ message: 'Leave deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import Regularization from '../models/Regularization.js';

export const applyRegularization = async (req, res) => {
  try {
    const { dates, reason } = req.body;
    // dates is a comma separated string
    const dateArray = dates.split(',');
    
    await Regularization.create({
      employee: req.user._id,
      dates: dateArray,
      reason,
      status: 'Pending'
    });
    
    res.status(201).json({ message: 'Regularization requested' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyRegularizations = async (req, res) => {
  try {
    const regularizations = await Regularization.find({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json(regularizations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRegularization = async (req, res) => {
  try {
    const reg = await Regularization.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Not found' });
    if (reg.employee.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    if (reg.status !== 'Pending') return res.status(400).json({ message: 'Cannot delete processed request' });
    
    await reg.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMonthlyAttendance = async (req, res) => {
  try {
    const { year, month } = req.query; // 1-indexed month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendances = await Attendance.find({
      employee: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Also get approved leaves that fall within this month
    const leaves = await Leave.find({
      employee: req.user._id,
      status: 'Approved',
      $or: [
        { fromDate: { $gte: startDate, $lte: endDate } },
        { toDate: { $gte: startDate, $lte: endDate } },
        { fromDate: { $lte: startDate }, toDate: { $gte: endDate } }
      ]
    });

    res.json({ attendances, leaves });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
