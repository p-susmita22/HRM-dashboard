import express from 'express';
import Message from '../models/Message.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get messages for an employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const messages = await Message.find({ employee: req.params.employeeId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Employee sending a message
router.post('/employee/:employeeId', async (req, res) => {
  try {
    const msg = await Message.create({
      employee: req.params.employeeId,
      content: req.body.content,
      sender: 'employee'
    });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Admin fetching all recent messages (for notifications)
router.get('/admin', admin, async (req, res) => {
  try {
    const messages = await Message.find().populate('employee', 'fullName employeeId').sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admin messages' });
  }
});

// Admin replying to an employee
router.post('/admin/:employeeId', admin, async (req, res) => {
  try {
    const msg = await Message.create({
      employee: req.params.employeeId,
      content: req.body.content,
      sender: 'admin'
    });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Error sending admin reply' });
  }
});

// Admin marking messages as read
router.put('/admin/read/:employeeId', admin, async (req, res) => {
  try {
    await Message.updateMany({ employee: req.params.employeeId, sender: 'employee' }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating read status' });
  }
});

export default router;
