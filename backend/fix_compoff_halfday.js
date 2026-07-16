/**
 * Fix: Sunday Half Day workers who got 0.5 comp off should get 1 full day
 * Add 0.5 more to each employee who worked on Sunday with Half Day status
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';
import Employee from './models/Employee.js';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const allAttendances = await Attendance.find({
    punchIn: { $exists: true, $ne: null },
    status: 'Half Day'
  }).populate('employee');

  const sundayHalfDays = allAttendances.filter(a => new Date(a.date).getDay() === 0);
  console.log(`Found ${sundayHalfDays.length} Sunday Half Day records to fix`);

  const processed = new Set();
  for (const att of sundayHalfDays) {
    if (!att.employee?._id) continue;
    const key = `${att.employee._id}-${new Date(att.date).toDateString()}`;
    if (processed.has(key)) continue;
    processed.add(key);

    const emp = await Employee.findById(att.employee._id);
    if (!emp) continue;

    // Add the remaining 0.5 to make it 1 total
    emp.compOffBalance = parseFloat(((emp.compOffBalance || 0) + 0.5).toFixed(1));
    await emp.save();
    console.log(`✅ ${emp.fullName} (${emp.employeeId}) | +0.5 added → New Balance: ${emp.compOffBalance}`);
  }

  console.log('\nDone!');
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
