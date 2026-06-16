import express from 'express';
import { getAllEmployees, addEmployee, deleteEmployee, editEmployee, toggleLockEmployee, uploadOfferLetter, sendPayslip, updatePayslip } from '../controllers/adminController.js';
import { getAllAttendance, approveAttendance, rejectAttendance, markHoliday, editHoliday, deleteHoliday, deleteAttendance } from '../controllers/adminController.js';
import { 
  getLeaveRequests, updateLeaveStatus, deleteLeaveRequest,
  getRegularizationRequests, updateRegularizationStatus, deleteRegularizationRequest,
  getResignationRequests, updateResignationStatus, deleteResignationRequest
} from '../controllers/adminController.js';
import {
  getAdminProfile, updateAdminProfile, changeAdminPassword, logoutOtherDevices
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.get('/employees', getAllEmployees);
router.post('/employees', addEmployee);
router.delete('/employees/:id', deleteEmployee);
router.put('/employees/:id', editEmployee);
router.put('/employees/:id/lock', toggleLockEmployee);
router.post('/employees/:id/offer-letter', uploadOfferLetter);
router.post('/employees/:id/payslip', sendPayslip);
router.put('/employees/:id/payslip/:payslipId', updatePayslip);

// Attendance Routes
router.get('/attendance', getAllAttendance);
router.put('/attendance/:id/approve', approveAttendance);
router.put('/attendance/:id/reject', rejectAttendance);
router.delete('/attendance/:id', deleteAttendance);
router.post('/attendance/holiday', markHoliday);
router.put('/attendance/holiday/:date', editHoliday);
router.delete('/attendance/holiday/:date', deleteHoliday);

// Requests Routes

router.get('/leaves', getLeaveRequests);
router.put('/leaves/:id/status', updateLeaveStatus);
router.delete('/leaves/:id', deleteLeaveRequest);

router.get('/regularizations', getRegularizationRequests);
router.put('/regularizations/:id/status', updateRegularizationStatus);
router.delete('/regularizations/:id', deleteRegularizationRequest);

router.get('/resignations', getResignationRequests);
router.put('/resignations/:id/status', updateResignationStatus);
router.delete('/resignations/:id', deleteResignationRequest);

// Profile Settings Routes

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/password', changeAdminPassword);
router.post('/logout-devices', logoutOtherDevices);

export default router;
