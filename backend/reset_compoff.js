import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multimaart-hrm';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await Employee.updateMany({}, { $set: { compOffBalance: 0 } });
    console.log(`Updated ${result.modifiedCount} employees.`);
    console.log('Finished updating comp off balance to 0 for all employees.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
