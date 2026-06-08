import Employee from '../models/Employee.js';

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ role: 'employee' }).sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const addEmployee = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, department, designation, joiningDate } = req.body;
    
    // Generate a serial EMP ID
    const lastEmployee = await Employee.findOne({ employeeId: /^EMP-/ }).sort({ createdAt: -1 });
    let nextIdNum = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const lastIdStr = lastEmployee.employeeId.replace('EMP-', '');
      const lastIdNum = parseInt(lastIdStr, 10);
      if (!isNaN(lastIdNum)) {
        nextIdNum = lastIdNum + 1;
      }
    }
    const employeeId = `EMP-${String(nextIdNum).padStart(3, '0')}`;

    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const employee = new Employee({
      employeeId,
      fullName,
      email,
      password,
      plainPassword: password,
      phoneNumber,
      department,
      designation,
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
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee removed successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
export const editEmployee = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, department, designation, password } = req.body;
    
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    employee.fullName = fullName;
    employee.email = email;
    employee.phoneNumber = phoneNumber;
    employee.department = department;
    employee.designation = designation;
    
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

export const uploadOfferLetter = async (req, res) => {
  try {
    // Basic mock implementation for file upload
    res.json({ message: 'Offer letter uploaded successfully' });
  } catch (error) {
    console.error('Error uploading offer letter:', error);
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

      if (hours >= 8) record.status = 'Present';
      else if (hours >= 4) record.status = 'Half Day';
      else record.status = 'Absent';
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
          adminStatus: 'Approved'
        });
      } else {
        existing.status = 'Holiday';
        existing.adminStatus = 'Approved';
        await existing.save();
      }
    }

    res.json({ message: 'Holiday marked successfully for all employees' });
  } catch (error) {
    console.error('Error marking holiday:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Requests Management ---
import Leave from '../models/Leave.js';
import Regularization from '../models/Regularization.js';
import Resignation from '../models/Resignation.js';

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
      const start = new Date(leave.fromDate);
      const end = new Date(leave.toDate);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        
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
            status: 'Absent',
            adminStatus: 'Approved'
          });
        } else {
          existing.status = 'Absent';
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
