import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const atts = await db.collection('attendances').find({ status: 'Half Day' }).limit(5).toArray();
    for (const a of atts) {
        console.log(`Punch In: ${a.punchIn}, Punch Out: ${a.punchOut}, Total Hours: ${a.totalHours}`);
    }
    process.exit(0);
}
test();
