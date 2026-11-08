import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
    records: [recordSchema],
    checkin: {
      open: { type: Boolean, default: false },
      secret: { type: String, select: false },
      openedAt: { type: Date },
      lateAfterMinutes: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ group: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);