import { Router } from 'express';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import requireAuth, { requireRole } from '../middleware/auth.js';
import { isValidToken } from '../utils/checkinToken.js';

const router = Router();
router.use(requireAuth, requireRole('family'));

router.get('/me', async (req, res) => {
  const user = await User.findById(req.userId);
  const student = user ? await Student.findById(user.student).populate('group') : null;
  if (!student) return res.status(404).json({ message: 'Student record no longer exists' });

  const tutor = await User.findById(student.owner).select('name');

  const sessions = await Attendance.find({
    group: student.group._id,
    'records.student': student._id,
  }).sort({ date: -1 });

  const history = sessions.map((s) => ({
    date: s.date,
    status: s.records.find((r) => String(r.student) === String(student._id)).status,
  }));

  const count = (status) => history.filter((h) => h.status === status).length;
  const present = count('present');
  const late = count('late');
  const absent = count('absent');
  const total = history.length;

  res.json({
    student: { name: student.name },
    group: {
      name: student.group.name,
      subject: student.group.subject,
      schedule: student.group.schedule,
    },
    tutor: { name: tutor ? tutor.name : '' },
    summary: {
      present,
      late,
      absent,
      total,
      rate: total ? Math.round(((present + late) / total) * 100) : null,
    },
    history,
  });
});
// POST /api/family/checkin  body: { session, token }  (the values from the QR link)
router.post('/checkin', async (req, res) => {
  const { session: sessionId, token } = req.body;

  const user = await User.findById(req.userId);
  const student = user ? await Student.findById(user.student) : null;
  if (!student) return res.status(404).json({ message: 'Student record no longer exists' });

  // Only sessions of the student's own group are visible to them.
  const session = await Attendance.findOne({ _id: sessionId, group: student.group }).select(
    '+checkin.secret'
  );
  if (!session || !session.checkin || !session.checkin.open) {
    return res.status(409).json({ message: 'Check-in is not open for this session' });
  }
  if (!isValidToken(session.checkin.secret, token)) {
    return res
      .status(400)
      .json({ message: 'This QR code has expired. Scan the one currently on the screen.' });
  }

  const minutes = (Date.now() - new Date(session.checkin.openedAt).getTime()) / 60000;
  const status = minutes > session.checkin.lateAfterMinutes ? 'late' : 'present';
  const openFilter = { _id: session._id, 'checkin.open': true };

  // First time this student scans: add the record.
  let result = await Attendance.updateOne(
    { ...openFilter, 'records.student': { $ne: student._id } },
    { $push: { records: { student: student._id, status } } }
  );

  // Check-in was reopened after a close marked them absent: upgrade the record.
  if (!result.modifiedCount) {
    result = await Attendance.updateOne(
      { ...openFilter, records: { $elemMatch: { student: student._id, status: 'absent' } } },
      { $set: { 'records.$.status': status } }
    );
  }

  if (!result.modifiedCount) {
    const current = session.records.find((r) => String(r.student) === String(student._id));
    if (!current) return res.status(409).json({ message: 'Check-in just closed' });
    return res.json({ already: true, status: current.status, date: session.date });
  }

  res.json({ already: false, status, date: session.date });
});
export default router;