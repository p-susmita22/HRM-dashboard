import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multimaart-hrm';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const exists = await Employee.findOne({ email: 'employee@multimaart.com' });
    if (exists) {
      console.log('Dummy employee already exists. Replacing...');
      await Employee.deleteOne({ email: 'employee@multimaart.com' });
    }

    const dummyEmployee = new Employee({
      employeeId: 'EMP-10024',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      gender: 'Male',
      email: 'employee@multimaart.com',
      password: 'password123',
      phoneNumber: '1234567890',
      department: 'Engineering',
      designation: 'Software Engineer',
      joiningDate: new Date(),
      role: 'employee',
      isActive: true,
      isLocked: false
    });

    await dummyEmployee.save();
    const adminExists = await Employee.findOne({ email: 'admin@multimaart.com' });
    if (adminExists) {
      console.log('Dummy admin already exists. Replacing...');
      await Employee.deleteOne({ email: 'admin@multimaart.com' });
    }

    const dummyAdmin = new Employee({
      employeeId: 'ADMIN-001',
      fullName: 'Super Admin',
      email: 'admin@multimaart.com',
      password: 'adminpassword',
      phoneNumber: '9876543210',
      department: 'Management',
      designation: 'HR Manager',
      joiningDate: new Date(),
      role: 'admin',
      isActive: true,
      isLocked: false
    });

    await dummyAdmin.save();

    console.log('====================================');
    console.log('SUCCESS! Dummy Data Created:');
    console.log('--- EMPLOYEE ---');
    console.log('Email ID: employee@multimaart.com');
    console.log('Password: password123');
    console.log('--- ADMIN ---');
    console.log('Email ID: admin@multimaart.com');
    console.log('Password: adminpassword');
    console.log('====================================');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.disconnect();
  }
};

seedDatabase();
