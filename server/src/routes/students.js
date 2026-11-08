import { Router } from 'express';
import Group from '../models/Group.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import requireAuth, { requireRole } from '../middleware/auth.js';
import { pick } from '../utils/pick.js';
import { makeLinkCode } from '../utils/linkCode.js';

const router = Router();
router.use(requireAuth, requireRole('tutor'));

router.get('/', async (req, res) => {
  const filter = { owner: req.userId };
  if (req.query.group) filter.group = req.query.group;

  const students = await Student.find(filter).sort({ name: 1 });
  res.json(students);
});

router.post('/', async (req, res) => {
  const { name, group } = req.body;
  if (!name || !group) {
    return res.status(400).json({ message: 'Student name and group are required' });
  }

  const ownsGroup = await Group.exists({ _id: group, owner: req.userId });
  if (!ownsGroup) return res.status(404).json({ message: 'Group not found' });

  const student = await Student.create({
    owner: req.userId,
    group,
    linkCode: makeLinkCode(),
    ...pick(req.body, ['name', 'phone', 'notes']),
  });
  res.status(201).json(student);
});

// Create or replace the code used by a parent/student to sign up.
// Accounts that already used the old code stay linked.
router.post('/:id/link-code', async (req, res) => {
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { linkCode: makeLinkCode() },
    { new: true }
  );
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

router.put('/:id', async (req, res) => {
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    pick(req.body, ['name', 'phone', 'notes']),
    { new: true, runValidators: true }
  );
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

router.delete('/:id', async (req, res) => {
  const student = await Student.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  await User.deleteMany({ student: student._id });
  await Attendance.updateMany(
    { owner: req.userId, group: student.group },
    { $pull: { records: { student: student._id } } }
  );

  res.json({ message: 'Student deleted' });
});

export default router;