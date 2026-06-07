import mongoose from 'mongoose';

const resignationSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  resignationDate: { type: Date, required: true },
  lastWorkingDay: { type: Date, required: true },
  reason: { type: String, required: true },
  agreedToNoticePeriod: { type: Boolean, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const Resignation = mongoose.model('Resignation', resignationSchema);
export default Resignation;
