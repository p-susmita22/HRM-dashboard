import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  punchIn: { type: Date },
  punchOut: { type: Date },
  status: { 
    type: String, 
    enum: ['Pending', 'Present', 'Absent', 'Half Day', 'Holiday', 'Leave Approved'],
    default: 'Pending'
  },
  adminStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  halfDayType: {
    type: String,
    enum: ['First Half Absent', 'Second Half Absent', 'None'],
    default: 'None'
  },
  totalHours: { type: Number, default: 0 },
  holidayName: { type: String }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
