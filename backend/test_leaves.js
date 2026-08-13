import mongoose from 'mongoose';
async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/hrm');
  const Leave = mongoose.model('Leave', new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    status: String,
    leaveType: String,
    dates: [Date],
    fromDate: Date,
    toDate: Date
  }, { strict: false }));
  const Employee = mongoose.model('Employee', new mongoose.Schema({
    fullName: String
  }, { strict: false }));

  const susmita = await Employee.findOne({ fullName: { $regex: 'susmita parida', $options: 'i' } });
  if (susmita) {
    const leaves = await Leave.find({ employee: susmita._id });
    console.log('Susmita Leaves:', JSON.stringify(leaves, null, 2));
  } else {
    console.log('Susmita not found');
  }
  process.exit();
}
run();
