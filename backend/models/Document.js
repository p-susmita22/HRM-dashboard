import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  documentType: {
    type: String,
    enum: ['Aadhaar Card', 'PAN Card', 'Resume', 'Passport Size Photo', 'Educational Certificates', 'Experience Certificates', 'Offer Letter', 'Appointment Letter', 'Joining Letter', 'Salary Structure', 'HR Policies'],
    required: true
  },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: String, enum: ['employee', 'admin'], default: 'employee' }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
