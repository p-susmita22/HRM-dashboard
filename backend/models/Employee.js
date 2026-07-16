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
  compOffBalance: { type: Number, default: 0 },
  consecutiveAbsents: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockedCount: { type: Number, default: 0 },
  inactiveCount: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date },
  loginActivity: [{
    device: String,
    ip: String,
    loginTime: Date
  }],
  documents: [{
    docType: String,
    url: String,
    fileName: String
  }],
  payslips: [{
    monthYear: String,
    panNo: String,
    accountNumber: String,
    pfAccountNumber: String,
    uanNumber: String,
    leavingDate: String,
    basicAnnual: String, basicMonthly: String, basicArrear: String, basicTotal: String,
    hraAnnual: String, hraMonthly: String, hraArrear: String, hraTotal: String,
    specialAnnual: String, specialMonthly: String, specialArrear: String, specialTotal: String,
    conveyanceAnnual: String, conveyanceMonthly: String, conveyanceArrear: String, conveyanceTotal: String,
    clientAnnual: String, clientMonthly: String, clientArrear: String, clientTotal: String,
    totalEarningsAnnual: String, totalEarningsMonthly: String, totalEarningsArrear: String, totalEarningsTotal: String,
    pfDeduction: String,
    totalDeductions: String,
    netPay: String,
    netPayWords: String,
    createdAt: { type: Date, default: Date.now }
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
