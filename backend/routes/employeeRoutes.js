import express from 'express';
import multer from 'multer';
import path from 'path';
import { getProfile, uploadDocument, getTodayAttendance, punchIn, punchOut, applyLeave, getMyLeaves, deleteLeave } from '../controllers/employeeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.use(protect);

router.get('/profile', getProfile);
router.post('/upload-doc', upload.single('document'), uploadDocument);

router.get('/attendance/today', getTodayAttendance);
router.post('/punch-in', punchIn);
router.post('/punch-out', punchOut);

router.get('/leaves', getMyLeaves);
router.post('/leaves', applyLeave);
router.delete('/leaves/:id', deleteLeave);

export default router;
