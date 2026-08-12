import mongoose from 'mongoose';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/hrm');
  const Leave = mongoose.model('Leave', new mongoose.Schema({
    employee: mongoose.Schema.Types.ObjectId,
    status: String,
    leaveType: String,
    dates: [Date],
    fromDate: Date,
    toDate: Date
  }));
  
  const empId = new mongoose.Types.ObjectId();
  await Leave.create({
    employee: empId,
    status: 'Approved',
    leaveType: 'Comp Off',
    dates: [new Date('2026-07-10T00:00:00.000Z')]
  });

  const startDate = new Date(2026, 6, 1);
  const endDate = new Date(2026, 6, 31, 23, 59, 59);

  const res1 = await Leave.find({
    employee: empId,
    status: 'Approved',
    dates: { $elemMatch: { $gte: startDate, $lte: endDate } }
  });

  const res2 = await Leave.find({
    employee: empId,
    status: 'Approved',
    dates: { $gte: startDate, $lte: endDate }
  });

  console.log('Result with elemMatch:', res1.length);
  console.log('Result without elemMatch:', res2.length);

  await Leave.deleteMany({ employee: empId });
  process.exit();
}
test();
