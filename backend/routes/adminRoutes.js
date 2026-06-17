import express from 'express';
import { getAllEmployees, addEmployee, deleteEmployee, editEmployee, toggleLockEmployee, uploadOfferLetter, deleteEmployeeDocument, uploadHRPolicies, getHRPolicies, deleteHRPolicies, sendPayslip, updatePayslip, getArchivedEmployees, restoreEmployee, permanentlyDeleteEmployee, getEmployeeHistory } from '../controllers/adminController.js';
import { getAllAttendance, approveAttendance, rejectAttendance, markHoliday, editHoliday, deleteHoliday, deleteAttendance, getRemotePunchRequests, approveRemotePunch, rejectRemotePunch } from '../controllers/adminController.js';
import { getSidebarCounts, getLeaveRequests, updateLeaveStatus, deleteLeaveRequest,
  getRegularizationRequests, updateRegularizationStatus, deleteRegularizationRequest,
  getResignationRequests, updateResignationStatus, deleteResignationRequest
} from '../controllers/adminController.js';
import {
  getAdminProfile, updateAdminProfile, changeAdminPassword, logoutOtherDevices
} from '../controllers/adminController.js';
import { getAllReceipts, saveReceipt, deleteReceipt } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `admin-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

router.use(protect, admin);

router.get('/sidebar-counts', getSidebarCounts);

router.get('/employees', getAllEmployees);
router.post('/employees', addEmployee);
router.delete('/employees/:id', deleteEmployee);
router.put('/employees/:id', editEmployee);
router.put('/employees/:id/lock', toggleLockEmployee);
router.post('/employees/:id/offer-letter', upload.single('offerLetter'), uploadOfferLetter);
router.delete('/employees/:id/documents/:docId', deleteEmployeeDocument);
router.post('/hr-policies', upload.single('document'), uploadHRPolicies);
router.get('/hr-policies', getHRPolicies);
router.delete('/hr-policies', deleteHRPolicies);
router.post('/employees/:id/payslip', sendPayslip);
router.put('/employees/:id/payslip/:payslipId', updatePayslip);

// Employee History (Archived)
router.get('/employees-history', getArchivedEmployees);
router.put('/employees/:id/restore', restoreEmployee);
router.delete('/employees/:id/permanent', permanentlyDeleteEmployee);
router.get('/employees/:id/history', getEmployeeHistory);

// Attendance Routes
router.get('/attendance', getAllAttendance);
router.put('/attendance/:id/approve', approveAttendance);
router.put('/attendance/:id/reject', rejectAttendance);
router.delete('/attendance/:id', deleteAttendance);
router.post('/attendance/holiday', markHoliday);
router.put('/attendance/holiday/:date', editHoliday);
router.delete('/attendance/holiday/:date', deleteHoliday);

import { deleteDailyReport } from '../controllers/adminController.js';
router.delete('/attendance/:id/report', deleteDailyReport);

// Remote Punch Requests
router.get('/attendance/remote-requests', getRemotePunchRequests);
router.put('/attendance/:id/remote-approve', approveRemotePunch);
router.put('/attendance/:id/remote-reject', rejectRemotePunch);

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

// Money Receipts
router.get('/receipts', getAllReceipts);
router.post('/receipts', saveReceipt);
router.delete('/receipts/:id', deleteReceipt);

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/password', changeAdminPassword);
router.post('/logout-devices', logoutOtherDevices);

export default router;
