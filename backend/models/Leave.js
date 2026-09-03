import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: {
    type: String,
    enum: ['Casual Leave', 'Sick Leave', 'Emergency Leave', 'Comp Off'],
    required: true
  },
  dates: { type: [Date], default: [] },
  fromDate: { type: Date },
  toDate: { type: Date },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  // Comp Off Cancel Request fields
  compOffRequested: { type: Boolean, default: false },
  compOffRequestStatus: {
    type: String,
    enum: ['None', 'Pending', 'Approved', 'Rejected'],
    default: 'None'
  },
  compOffRequestReason: { type: String }
}, { timestamps: true });

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;

