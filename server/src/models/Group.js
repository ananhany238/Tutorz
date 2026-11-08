import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: '' },
    schedule: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Group', groupSchema);