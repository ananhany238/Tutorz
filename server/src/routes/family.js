import { Router } from 'express';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import requireAuth, { requireRole } from '../middleware/auth.js';

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

export default router;