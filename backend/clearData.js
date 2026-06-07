import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multimaart-hrm';

const clearData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    // Delete all dummy employees, but keep the admin
    const result = await Employee.deleteMany({ role: 'employee' });
    console.log(`Successfully deleted ${result.deletedCount} dummy employee(s).`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
};

clearData();
