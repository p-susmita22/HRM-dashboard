import express from 'express';
import { loginEmployee, registerAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.post('/register-admin', registerAdmin);

export default router;
