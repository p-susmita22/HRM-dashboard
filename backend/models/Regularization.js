import mongoose from 'mongoose';

const regularizationSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  dates: { type: [Date], default: [] },
  fromDate: { type: Date },
  toDate: { type: Date },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const Regularization = mongoose.model('Regularization', regularizationSchema);
export default Regularization;
