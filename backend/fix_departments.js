import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multimaart-hrm';

const fixDepartments = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const employees = await Employee.find({});
    for (const emp of employees) {
      if (emp.department) {
        let dept = emp.department.trim();
        const lowerDept = dept.toLowerCase();
        
        if (lowerDept === 'opertion & it' || lowerDept === 'operation & it' || lowerDept === 'operations & it') {
          dept = 'Operations & IT';
        } else if (lowerDept === 'operation' || lowerDept === 'operations') {
          dept = 'Operations';
        } else if (lowerDept === 'hr') {
          dept = 'HR';
        } else if (lowerDept === 'it') {
          dept = 'IT';
        } else if (lowerDept === 'back office' || lowerDept === 'backoffice') {
          dept = 'Back Office';
        } else {
          dept = dept.charAt(0).toUpperCase() + dept.slice(1);
        }

        if (emp.department !== dept) {
          console.log(`Updating ${emp.email} from '${emp.department}' to '${dept}'`);
          emp.department = dept;
          await emp.save();
        }
      }
    }
    console.log('Done fixing departments.');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
};

fixDepartments();
