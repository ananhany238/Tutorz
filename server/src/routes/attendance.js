import { Router } from 'express';
import crypto from 'crypto';
import Group from '../models/Group.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import requireAuth, { requireRole } from '../middleware/auth.js';
import { currentToken, secondsLeft } from '../utils/checkinToken.js';

const router = Router();
router.use(requireAuth, requireRole('tutor'));

const STATUSES = ['present', 'absent', 'late'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Never send the check-in secret to the browser.
const publicSession = (s) => ({
  _id: s._id,
  group: s.group,
  date: s.date,
  records: s.records,
  checkin: {
    open: Boolean(s.checkin && s.checkin.open),
    openedAt: s.checkin && s.checkin.openedAt,
    lateAfterMinutes: (s.checkin && s.checkin.lateAfterMinutes) || 10,
  },
});

// GET /api/attendance?group=ID            -> all sessions for the group
// GET /api/attendance?group=ID&date=DATE  -> one session
router.get('/', async (req, res) => {
  const { group, date } = req.query;
  if (!group) return res.status(400).json({ message: 'group is required' });

  const filter = { owner: req.userId, group };

  if (date) {
    const session = await Attendance.findOne({ ...filter, date });
    return res.json(
      session ? publicSession(session) : { group, date, records: [], checkin: { open: false } }
    );
  }

  const sessions = await Attendance.find(filter).sort({ date: -1 });
  res.json(sessions.map(publicSession));
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

  const current = await Attendance.findOne({ owner: req.userId, group, date });
  if (current && current.checkin && current.checkin.open) {
    return res.status(409).json({ message: 'Close check-in before editing attendance' });
  }

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
  res.json(publicSession(session));
});

// POST /api/attendance/checkin/start  body: { group, date, lateAfterMinutes }
router.post('/checkin/start', async (req, res) => {
  const { group, date } = req.body;
  const lateAfter = Math.min(Math.max(Number(req.body.lateAfterMinutes) || 10, 1), 120);

  if (!group || !DATE_RE.test(date || '')) {
    return res.status(400).json({ message: 'group and date (YYYY-MM-DD) are required' });
  }

  const ownsGroup = await Group.exists({ _id: group, owner: req.userId });
  if (!ownsGroup) return res.status(404).json({ message: 'Group not found' });

  const secret = crypto.randomBytes(16).toString('hex');

  const session = await Attendance.findOneAndUpdate(
    { owner: req.userId, group, date },
    {
      $set: {
        'checkin.open': true,
        'checkin.secret': secret,
        'checkin.openedAt': new Date(),
        'checkin.lateAfterMinutes': lateAfter,
      },
      $setOnInsert: { records: [] },
    },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(publicSession(session));
});

// GET /api/attendance/checkin/:id/token  -> the code currently shown in the QR
router.get('/checkin/:id/token', async (req, res) => {
  const session = await Attendance.findOne({ _id: req.params.id, owner: req.userId }).select(
    '+checkin.secret'
  );
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (!session.checkin || !session.checkin.open) {
    return res.status(409).json({ message: 'Check-in is closed' });
  }
  res.json({ token: currentToken(session.checkin.secret), expiresIn: secondsLeft() });
});

// POST /api/attendance/checkin/:id/close  -> everyone who did not scan becomes absent
router.post('/checkin/:id/close', async (req, res) => {
  const session = await Attendance.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { $set: { 'checkin.open': false }, $unset: { 'checkin.secret': '' } },
    { new: true }
  );
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const students = await Student.find({ group: session.group, owner: req.userId }).select('_id');
  const marked = new Set(session.records.map((r) => String(r.student)));
  const missing = students
    .filter((s) => !marked.has(String(s._id)))
    .map((s) => ({ student: s._id, status: 'absent' }));

  const updated = missing.length
    ? await Attendance.findByIdAndUpdate(
        session._id,
        { $push: { records: { $each: missing } } },
        { new: true }
      )
    : session;

  res.json(publicSession(updated));
});

export default router;