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

import CompanyDocument from '../models/CompanyDocument.js';

export const getCompanyDocuments = async (req, res) => {
  try {
    const docs = await CompanyDocument.find();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
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
    const { location, isRemote } = req.body;
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
      punchInLocation: location || null,
      status: 'Present',
      isRemote: isRemote || false,
      remoteStatus: isRemote ? 'Pending' : 'None'
    });
    
    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const punchOut = async (req, res) => {
  try {
    const { location, isRemoteOut } = req.body;
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
    
    if (!attendance.dailyReport) {
      return res.status(400).json({ message: 'You must submit your daily report before punching out.' });
    }
    
    attendance.punchOut = new Date();
    attendance.punchOutLocation = location || null;
    attendance.isRemoteOut = isRemoteOut || false;
    attendance.remoteOutStatus = isRemoteOut ? 'Pending' : 'None';
    
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
    
    if (isHalfDay) {
      attendance.status = 'Half Day';
    } else {
      attendance.status = 'Present';
    }
    
    await attendance.save();

    // --- Auto Comp Off for Sunday work ---
    const punchDate = new Date(attendance.date);
    if (punchDate.getDay() === 0) { // 0 = Sunday
      const compOffDays = isHalfDay ? 0.5 : 1;
      const employee = await Employee.findById(req.user._id);
      if (employee) {
        employee.compOffBalance = parseFloat(((employee.compOffBalance || 0) + compOffDays).toFixed(1));
        await employee.save();
      }
    }

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

    // If it's a Comp Off leave, check balance
    if (leaveType === 'Comp Off') {
      const employee = await Employee.findById(req.user._id);
      if (!employee || (employee.compOffBalance || 0) < dateArray.length) {
        return res.status(400).json({ 
          message: `Insufficient Comp Off balance. Available: ${employee?.compOffBalance || 0} day(s), Requested: ${dateArray.length} day(s).` 
        });
      }
    }

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

import Resignation from '../models/Resignation.js';

export const applyResignation = async (req, res) => {
  try {
    const { resignationDate, lastWorkingDay, reason, agreedToNoticePeriod } = req.body;
    
    // Check if already applied
    const existing = await Resignation.findOne({ employee: req.user._id, status: { $ne: 'Rejected' } });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a resignation request.' });
    }

    const resignation = await Resignation.create({
      employee: req.user._id,
      resignationDate,
      lastWorkingDay,
      reason,
      agreedToNoticePeriod,
      status: 'Pending'
    });
    
    res.status(201).json(resignation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyResignation = async (req, res) => {
  try {
    const resignation = await Resignation.findOne({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json(resignation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitDailyReport = async (req, res) => {
  try {
    const { reportContent } = req.body;
    if (!reportContent || reportContent.trim().split(/\s+/).length < 50) {
      return res.status(400).json({ message: 'Report must be at least 50 words.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today }
    });

    if (!attendance || !attendance.punchIn) {
      return res.status(400).json({ message: 'Must be punched in to submit a report.' });
    }

    attendance.dailyReport = reportContent;
    attendance.isReportRead = false;
    await attendance.save();

    res.json({ message: 'Daily report submitted successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteDailyReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for today.' });
    }

    attendance.dailyReport = null;
    await attendance.save();

    res.json({ message: 'Daily report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
