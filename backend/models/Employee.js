import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  fullName: { type: String, required: true },
  gender: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plainPassword: { type: String },
  phoneNumber: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  region: { type: String },
  zone: { type: String },
  joiningDate: { type: Date, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  isActive: { type: Boolean, default: true },
  consecutiveAbsents: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  loginActivity: [{
    device: String,
    ip: String,
    loginTime: Date
  }],
  documents: [{
    docType: String,
    url: String,
    fileName: String
  }]
}, { timestamps: true });

employeeSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
