import express from 'express';
import { loginEmployee, registerAdmin, logoutEmployee } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.post('/logout', protect, logoutEmployee);
router.post('/register-admin', registerAdmin);

export default router;
