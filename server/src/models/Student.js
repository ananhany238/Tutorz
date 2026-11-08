import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    linkCode: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.model('Student', studentSchema);