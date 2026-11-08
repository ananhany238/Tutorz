import { Router } from 'express';
import Group from '../models/Group.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import requireAuth, { requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth, requireRole('tutor'));
const STATUSES = ['present', 'absent', 'late'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/attendance?group=ID            -> all sessions for the group
// GET /api/attendance?group=ID&date=DATE  -> one session
router.get('/', async (req, res) => {
  const { group, date } = req.query;
  if (!group) return res.status(400).json({ message: 'group is required' });

  const filter = { owner: req.userId, group };

  if (date) {
    const session = await Attendance.findOne({ ...filter, date });
    return res.json(session || { group, date, records: [] });
  }

  const sessions = await Attendance.find(filter).sort({ date: -1 });
  res.json(sessions);
});

// PUT /api/attendance  body: { group, date, records: [{ student, status }] }
router.put('/', async (req, res) => {
  const { group, date, records } = req.body;

  if (!group || !DATE_RE.test(date || '') || !Array.isArray(records)) {
    return res.status(400).json({ message: 'group, date (YYYY-MM-DD) and records[] are required' });
  }
  if (records.some((r) => !STATUSES.includes(r.status))) {
    return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
  }

  const ownsGroup = await Group.exists({ _id: group, owner: req.userId });
  if (!ownsGroup) return res.status(404).json({ message: 'Group not found' });

  const ids = records.map((r) => r.student);
  const valid = await Student.countDocuments({ _id: { $in: ids }, group, owner: req.userId });
  if (valid !== new Set(ids.map(String)).size) {
    return res.status(400).json({ message: 'Some students do not belong to this group' });
  }

  const session = await Attendance.findOneAndUpdate(
    { owner: req.userId, group, date },
    { owner: req.userId, group, date, records },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(session);
});

export default router;