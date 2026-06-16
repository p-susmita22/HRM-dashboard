import mongoose from 'mongoose';

const moneyReceiptSchema = new mongoose.Schema({
  refNo: { type: String, required: true },
  date: { type: Date, required: true },
  receivedFrom: { type: String },
  contactNumber: { type: String },
  address: { type: String },
  addressLine2: { type: String },
  amountNumber: { type: String },
  amountWords: { type: String },
  modeOfPayment: { type: String },
  transactionId: { type: String },
  declaration: { type: String }
}, { timestamps: true });

const MoneyReceipt = mongoose.model('MoneyReceipt', moneyReceiptSchema);
export default MoneyReceipt;
