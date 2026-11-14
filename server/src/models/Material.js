import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true, trim: true, maxlength: 2000 },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Material', materialSchema);