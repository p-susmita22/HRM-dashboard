import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';
dotenv.config();

const fixHalfDays = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const halfDays = await Attendance.find({ status: 'Half Day', totalHours: { $gte: 8 } });
        console.log(`Found ${halfDays.length} records that are marked as Half Day but have >= 8 hours.`);
        for (const record of halfDays) {
            record.status = 'Present';
            await record.save();
        }
        console.log('Fixed records.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixHalfDays();
