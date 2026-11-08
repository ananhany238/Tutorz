import { Router } from 'express';
import Group from '../models/Group.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import requireAuth, { requireRole } from '../middleware/auth.js';
import { pick } from '../utils/pick.js';

const router = Router();
router.use(requireAuth, requireRole('tutor'));

router.get('/', async (req, res) => {
  const groups = await Group.find({ owner: req.userId }).sort({ createdAt: -1 });
  res.json(groups);
});

router.get('/:id', async (req, res) => {
  const group = await Group.findOne({ _id: req.params.id, owner: req.userId });
  if (!group) return res.status(404).json({ message: 'Group not found' });
  res.json(group);
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Group name is required' });

  const group = await Group.create({
    owner: req.userId,
    ...pick(req.body, ['name', 'subject', 'schedule']),
  });
  res.status(201).json(group);
});

router.put('/:id', async (req, res) => {
  const group = await Group.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    pick(req.body, ['name', 'subject', 'schedule']),
    { new: true, runValidators: true }
  );
  if (!group) return res.status(404).json({ message: 'Group not found' });
  res.json(group);
});

router.delete('/:id', async (req, res) => {
  const group = await Group.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const students = await Student.find({ group: group._id }).select('_id');
  await User.deleteMany({ student: { $in: students.map((s) => s._id) } });
  await Student.deleteMany({ group: group._id });
  await Attendance.deleteMany({ group: group._id });

  res.json({ message: 'Group deleted' });
});

export default router;