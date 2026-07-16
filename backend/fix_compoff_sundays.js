/**
 * Retroactive Comp Off credit script
 * Scans all attendance records where the date falls on a Sunday
 * and the employee has a punch-in (actually worked).
 * Credits: Full Day = 1 comp off, Half Day = 0.5 comp off
 * Skips if record status is 'Holiday', 'Absent', 'Leave', 'Leave Approved'
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';
import Employee from './models/Employee.js';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Find all attendance records on Sundays with a punch-in
  const allAttendances = await Attendance.find({
    punchIn: { $exists: true, $ne: null },
    status: { $in: ['Present', 'Half Day'] }
  }).populate('employee');

  const sundayAttendances = allAttendances.filter(a => new Date(a.date).getDay() === 0);

  console.log(`Found ${sundayAttendances.length} Sunday work records`);

  // Group by employee to avoid duplicate crediting
  // Track which (employee + date) combos we've already processed
  const processed = new Set();
  let totalCredited = 0;

  for (const att of sundayAttendances) {
    if (!att.employee || !att.employee._id) continue;

    const key = `${att.employee._id}-${new Date(att.date).toDateString()}`;
    if (processed.has(key)) continue;
    processed.add(key);

    const compOffDays = att.status === 'Half Day' ? 0.5 : 1;
    const emp = await Employee.findById(att.employee._id);
    if (!emp) continue;

    const oldBalance = emp.compOffBalance || 0;
    emp.compOffBalance = parseFloat((oldBalance + compOffDays).toFixed(1));
    await emp.save();

    console.log(`✅ ${emp.fullName} (${emp.employeeId}) | Date: ${new Date(att.date).toDateString()} | Status: ${att.status} | +${compOffDays} → New Balance: ${emp.compOffBalance}`);
    totalCredited++;
  }

  console.log(`\nDone! Credited Comp Off to ${totalCredited} records.`);
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
