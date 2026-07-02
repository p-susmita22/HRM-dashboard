import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const emp = await db.collection('employees').findOne({ email: 'somanathdas139@gmail.com' });
    const att = await db.collection('attendances').find({ employee: emp._id }).toArray();
    console.log('Total records:', att.length);
    let present = 0, pending = 0, absent = 0, half = 0;
    for (const a of att) {
      if (a.status === 'Present') present++;
      if (a.status === 'Absent') absent++;
      if (a.status === 'Half Day') half++;
      if (a.adminStatus === 'Pending') pending++;
    }
    console.log('Status: Present', present, 'Absent', absent, 'Half', half, 'Pending admin:', pending);
    process.exit(0);
}
test();
