import Employee from '../models/Employee.js';

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ role: 'employee', isArchived: { $ne: true } }).sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const addEmployee = async (req, res) => {
  try {
    const { employeeId: customEmployeeId, firstName, middleName, lastName, email, password, phoneNumber, department, designation, gender, region, zone, joiningDate } = req.body;
    
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    
    let employeeId = customEmployeeId;
    if (!employeeId) {
      const lastEmployee = await Employee.findOne({ employeeId: /^EMP-/ }).sort({ createdAt: -1 });
      let nextIdNum = 1;
      if (lastEmployee && lastEmployee.employeeId) {
        const lastIdStr = lastEmployee.employeeId.replace('EMP-', '');
        const lastIdNum = parseInt(lastIdStr, 10);
        if (!isNaN(lastIdNum)) {
          nextIdNum = lastIdNum + 1;
        }
      }
      employeeId = `EMP-${String(nextIdNum).padStart(3, '0')}`;
    }

    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const employee = new Employee({
      employeeId,
      firstName,
      middleName,
      lastName,
      fullName,
      gender,
      email,
      password,
      plainPassword: password,
      phoneNumber,
      department,
      designation,
      region,
      zone,
      joiningDate: joiningDate || new Date(),
      role: 'employee'
    });

    await employee.save();
    
    // Remove password from response
    const empData = employee.toObject();
    delete empData.password;
    
    res.status(201).json(empData);
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    // Soft-delete: archive instead of permanently removing
    employee.isArchived = true;
    employee.archivedAt = new Date();
    employee.isActive = false;
    await employee.save();
    
    res.json({ message: 'Employee moved to history successfully' });
  } catch (error) {
    console.error('Error archiving employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getArchivedEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isArchived: true }).select('-password').sort({ archivedAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching archived employees:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const restoreEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    employee.isArchived = false;
    employee.archivedAt = undefined;
    employee.isActive = true;
    await employee.save();
    res.json({ message: 'Employee restored successfully' });
  } catch (error) {
    console.error('Error restoring employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const permanentlyDeleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    await Employee.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ employee: req.params.id });
    await Leave.deleteMany({ employee: req.params.id });
    await Regularization.deleteMany({ employee: req.params.id });
    await Resignation.deleteMany({ employee: req.params.id });
    
    res.json({ message: 'Employee permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getEmployeeHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const [attendance, leaves, regularizations, resignations] = await Promise.all([
      Attendance.find({ employee: id }).sort({ date: -1 }),
      Leave.find({ employee: id }).sort({ createdAt: -1 }),
      Regularization.find({ employee: id }).sort({ createdAt: -1 }),
      Resignation.find({ employee: id }).sort({ createdAt: -1 }),
    ]);
    res.json({ attendance, leaves, regularizations, resignations });
  } catch (error) {
    console.error('Error fetching employee history:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

  export const editEmployee = async (req, res) => {
    try {
      const { employeeId, firstName, middleName, lastName, email, phoneNumber, department, designation, gender, region, zone, password, isActive } = req.body;
      
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      
      const employee = await Employee.findById(req.params.id);
      if (!employee) return res.status(404).json({ message: 'Employee not found' });
      
      if (employeeId) employee.employeeId = employeeId;
      employee.firstName = firstName;
      employee.middleName = middleName;
      employee.lastName = lastName;
      employee.fullName = fullName;
      employee.gender = gender;
      employee.email = email;
      employee.phoneNumber = phoneNumber;
      employee.department = department;
      employee.designation = designation;
      employee.region = region;
      employee.zone = zone;
      
      if (isActive !== undefined) {
        employee.isActive = isActive;
      }
      
      if (password && password.trim() !== '') {
        employee.password = password;
        employee.plainPassword = password;
      }
    
    await employee.save();
    
    res.json(employee);
  } catch (error) {
    console.error('Error editing employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const toggleLockEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    employee.isLocked = !employee.isLocked;
    await employee.save();
    
    res.json({ message: `Employee ${employee.isLocked ? 'locked' : 'unlocked'} successfully`, isLocked: employee.isLocked });
  } catch (error) {
    console.error('Error locking employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

import CompanyDocument from '../models/CompanyDocument.js';

export const uploadHRPolicies = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const docType = 'HR Policies';
    const url = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;

    let companyDoc = await CompanyDocument.findOne({ docType });
    if (companyDoc) {
      companyDoc.url = url;
      companyDoc.fileName = fileName;
    } else {
      companyDoc = new CompanyDocument({ docType, url, fileName });
    }

    await companyDoc.save();
    res.json({ message: 'HR Policies uploaded successfully', document: companyDoc });
  } catch (error) {
    console.error('Error uploading HR Policies:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getHRPolicies = async (req, res) => {
  try {
    const companyDoc = await CompanyDocument.findOne({ docType: 'HR Policies' });
    res.json(companyDoc);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteHRPolicies = async (req, res) => {
  try {
    await CompanyDocument.findOneAndDelete({ docType: 'HR Policies' });
    res.json({ message: 'HR Policies deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const uploadOfferLetter = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const docType = 'Offer Letter';
    const url = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;

    const existingDocIndex = employee.documents.findIndex(d => d.docType === docType);
    if (existingDocIndex >= 0) {
      employee.documents[existingDocIndex] = { docType, url, fileName };
    } else {
      employee.documents.push({ docType, url, fileName });
    }

    await employee.save();
    res.json({ message: 'Offer letter uploaded successfully', document: { docType, url, fileName } });
  } catch (error) {
    console.error('Error uploading offer letter:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteEmployeeDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.documents = employee.documents.filter(doc => doc._id.toString() !== req.params.docId);
    await employee.save();

    res.json({ message: 'Document deleted successfully', documents: employee.documents });
  } catch (error) {
    console.error('Error deleting employee document:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const sendPayslip = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    employee.payslips.push(req.body);
    await employee.save();
    
    res.json({ message: 'Payslip saved and sent successfully', payslips: employee.payslips });
  } catch (error) {
    console.error('Error sending payslip:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updatePayslip = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    const payslip = employee.payslips.id(req.params.payslipId);
    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });
    
    // Remove _id from body to prevent modifying immutable field error
    delete req.body._id;
    
    payslip.set(req.body);
    await employee.save();
    
    res.json({ message: 'Payslip updated successfully', payslips: employee.payslips });
  } catch (error) {
    console.error('Error updating payslip:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
// --- Attendance Management ---
import Attendance from '../models/Attendance.js';

export const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('employee', 'fullName employeeId department')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const approveAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    if (record.punchIn && record.punchOut) {
      const msDiff = new Date(record.punchOut).getTime() - new Date(record.punchIn).getTime();
      const hours = msDiff / (1000 * 60 * 60);
      record.totalHours = parseFloat(hours.toFixed(2));

      // For testing/demo purposes, we mark them as Present if they punched out at all.
      // In a real system, you'd strictly check hours >= 8 for Present.
      if (hours >= 8) record.status = 'Present';
      else record.status = 'Half Day';
    } else {
      record.status = 'Absent'; // If no punch out, it's considered absent
    }

    record.adminStatus = 'Approved';
    await record.save();
    
    // Return populated record to update UI instantly
    const updatedRecord = await Attendance.findById(req.params.id).populate('employee', 'fullName employeeId department');
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error approving attendance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const rejectAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    record.status = 'Absent';
    record.adminStatus = 'Rejected';
    await record.save();
    
    const updatedRecord = await Attendance.findById(req.params.id).populate('employee', 'fullName employeeId department');
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error rejecting attendance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getRemotePunchRequests = async (req, res) => {
  try {
    const records = await Attendance.find({ isRemote: true, remoteStatus: 'Pending' })
      .populate('employee', 'fullName employeeId department')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching remote punch requests:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const approveRemotePunch = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    record.remoteStatus = 'Approved';
    record.adminStatus = 'Approved';
    await record.save();
    const updated = await Attendance.findById(req.params.id).populate('employee', 'fullName employeeId department');
    res.json(updated);
  } catch (error) {
    console.error('Error approving remote punch:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const rejectRemotePunch = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    record.remoteStatus = 'Rejected';
    record.status = 'Absent';
    record.adminStatus = 'Rejected';
    await record.save();
    const updated = await Attendance.findById(req.params.id).populate('employee', 'fullName employeeId department');
    res.json(updated);
  } catch (error) {
    console.error('Error rejecting remote punch:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};



export const markHoliday = async (req, res) => {
  try {
    const { date, reason } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    
    // Create a holiday attendance record for all active employees
    const employees = await Employee.find({ role: 'employee', isActive: true });
    
    for (const emp of employees) {
      // Check if record exists
      const existing = await Attendance.findOne({
        employee: emp._id,
        date: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (!existing) {
        await Attendance.create({
          employee: emp._id,
          date: targetDate,
          status: 'Holiday',
          adminStatus: 'Approved',
          holidayName: reason
        });
      } else {
        existing.status = 'Holiday';
        existing.adminStatus = 'Approved';
        existing.holidayName = reason;
        await existing.save();
      }
    }

    res.json({ message: 'Holiday marked successfully for all employees' });
  } catch (error) {
    console.error('Error marking holiday:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const editHoliday = async (req, res) => {
  try {
    const { date } = req.params;
    const { newDate, reason } = req.body;
    
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    
    const newTargetDate = new Date(newDate || date);
    newTargetDate.setHours(0,0,0,0);
    
    // Find all attendance records marked as holiday on the old date
    const holidays = await Attendance.find({
      status: 'Holiday',
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    for (const holiday of holidays) {
      holiday.date = newTargetDate;
      holiday.holidayName = reason;
      await holiday.save();
    }

    res.json({ message: 'Holiday updated successfully' });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    
    await Attendance.deleteMany({
      status: 'Holiday',
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Requests Management ---
import Leave from '../models/Leave.js';
import Regularization from '../models/Regularization.js';
import Resignation from '../models/Resignation.js';
import Message from '../models/Message.js';

export const getSidebarCounts = async (req, res) => {
  try {
    const attendancePending = await Attendance.countDocuments({ adminStatus: 'Pending' });
    const remotePending = await Attendance.countDocuments({ isRemote: true, remoteStatus: 'Pending' });
    const leavesPending = await Leave.countDocuments({ status: 'Pending' });
    const regularizationsPending = await Regularization.countDocuments({ status: 'Pending' });
    const resignationsPending = await Resignation.countDocuments({ status: 'Pending' });
    const unreadMessages = await Message.countDocuments({ receiver: 'admin', isRead: false });

    res.json({
      attendanceCount: attendancePending + remotePending,
      requestsCount: leavesPending + regularizationsPending + resignationsPending,
      notificationsCount: unreadMessages
    });
  } catch (error) {
    console.error('Error fetching sidebar counts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLeaveRequests = async (req, res) => {
  try {
    const leaves = await Leave.find().populate('employee', 'fullName employeeId department').sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('employee', 'fullName employeeId');
    
    if (req.body.status === 'Approved') {
      let datesToProcess = [];
      if (leave.dates && leave.dates.length > 0) {
        datesToProcess = leave.dates;
      } else {
        const start = new Date(leave.fromDate);
        const end = new Date(leave.toDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          datesToProcess.push(new Date(d));
        }
      }

      for (const d of datesToProcess) {
        if (!d) continue;
        const currentDate = new Date(d);
        currentDate.setHours(0,0,0,0);
        
        const existing = await Attendance.findOne({
          employee: leave.employee._id,
          date: {
            $gte: currentDate,
            $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (!existing) {
          await Attendance.create({
            employee: leave.employee._id,
            date: currentDate,
            status: 'Leave Approved',
            adminStatus: 'Approved'
          });
        } else {
          existing.status = 'Leave Approved';
          existing.adminStatus = 'Approved';
          await existing.save();
        }
      }
    }
    
    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRegularizationRequests = async (req, res) => {
  try {
    const regularizations = await Regularization.find().populate('employee', 'fullName employeeId department').sort({ createdAt: -1 });
    res.json(regularizations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRegularizationStatus = async (req, res) => {
  try {
    const reg = await Regularization.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('employee', 'fullName employeeId');
    
    if (req.body.status === 'Approved') {
      const datesToProcess = reg.dates && reg.dates.length > 0 ? reg.dates : [reg.fromDate];
      for (const d of datesToProcess) {
        if (!d) continue;
        const currentDate = new Date(d);
        currentDate.setHours(0,0,0,0);
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // 1. Update or create Attendance as Present
        const existing = await Attendance.findOne({
          employee: reg.employee._id,
          date: { $gte: currentDate, $lt: nextDay }
        });

        if (existing) {
          existing.status = 'Present';
          existing.halfDayType = null;
          existing.adminStatus = 'Approved';
          await existing.save();
        } else {
          await Attendance.create({
            employee: reg.employee._id,
            date: currentDate,
            status: 'Present',
            adminStatus: 'Approved'
          });
        }

        // 2. Cancel any overlapping Leaves
        await Leave.deleteMany({
          employee: reg.employee._id,
          fromDate: { $lte: currentDate },
          toDate: { $gte: currentDate }
        });
      }
    }

    res.json(reg);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getResignationRequests = async (req, res) => {
  try {
    const resignations = await Resignation.find().populate('employee', 'fullName employeeId department').sort({ createdAt: -1 });
    res.json(resignations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateResignationStatus = async (req, res) => {
  try {
    const resig = await Resignation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('employee', 'fullName employeeId');
    res.json(resig);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const deleteLeaveRequest = async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRegularizationRequest = async (req, res) => {
  try {
    await Regularization.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteResignationRequest = async (req, res) => {
  try {
    await Resignation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
// --- Admin Profile Settings ---
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Employee.findOne({ role: 'admin' }).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { fullName, email, phoneNumber } = req.body;
    const admin = await Employee.findOneAndUpdate(
      { role: 'admin' },
      { fullName, email, phoneNumber },
      { new: true }
    ).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const admin = await Employee.findOne({ role: 'admin' });
    
    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logoutOtherDevices = async (req, res) => {
  try {
    const admin = await Employee.findOne({ role: 'admin' });
    // Keep only the most recent login activity
    if (admin.loginActivity && admin.loginActivity.length > 0) {
      admin.loginActivity = [admin.loginActivity[admin.loginActivity.length - 1]];
      await admin.save();
    }
    res.json({ message: 'Logged out of all other devices', loginActivity: admin.loginActivity });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Money Receipts ---
import MoneyReceipt from '../models/MoneyReceipt.js';

export const getAllReceipts = async (req, res) => {
  try {
    const receipts = await MoneyReceipt.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const saveReceipt = async (req, res) => {
  try {
    // If it has an _id, it means we are editing an existing receipt
    if (req.body._id) {
      const receipt = await MoneyReceipt.findByIdAndUpdate(req.body._id, req.body, { new: true });
      return res.json(receipt);
    }
    
    // Otherwise create a new one
    const receipt = new MoneyReceipt(req.body);
    await receipt.save();
    res.status(201).json(receipt);
  } catch (error) {
    console.error('Error saving receipt:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteReceipt = async (req, res) => {
  try {
    await MoneyReceipt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
