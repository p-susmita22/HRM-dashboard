import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  content: { type: String, required: true },
  sender: { type: String, enum: ['employee', 'admin'], required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
