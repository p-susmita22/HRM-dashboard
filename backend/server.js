import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/employee', employeeRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multimaart-hrm';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.io integration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Pass io to routes
app.set('io', io);

// Basic Route
app.get('/', (req, res) => {
  res.send('Multimaart HRM API is running...');
});

import { exec } from 'child_process';

const PORT = process.env.PORT || 5006;
const startServer = () => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
        if (stdout) {
          const lines = stdout.trim().split('\n');
          const listeningLine = lines.find(line => line.includes('LISTENING'));
          if (listeningLine) {
            const pid = listeningLine.trim().split(/\s+/).pop();
            if (pid) {
              exec(`taskkill /PID ${pid} /F`, () => {
                setTimeout(() => {
                  server.close();
                  startServer();
                }, 1000);
              });
            }
          }
        }
      });
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer();
