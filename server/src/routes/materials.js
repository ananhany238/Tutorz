import { Router } from 'express';
import Group from '../models/Group.js';
import Material from '../models/Material.js';
import requireAuth, { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('tutor'));

// Only web links are accepted, so "javascript:" style links can never be stored.
const isWebUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

router.get('/', async (req, res) => {
  const { group } = req.query;
  if (!group) return res.status(400).json({ message: 'group is required' });

  const items = await Material.find({ owner: req.userId, group }).sort({ createdAt: -1 });
  res.json(items);
});

router.post('/', async (req, res) => {
  const { group, title, url, note = '' } = req.body;

  if (!group || !title || !url) {
    return res.status(400).json({ message: 'group, title and link are required' });
  }
  if (!isWebUrl(String(url).trim())) {
    return res.status(400).json({ message: 'The link must start with http:// or https://' });
  }

  const ownsGroup = await Group.exists({ _id: group, owner: req.userId });
  if (!ownsGroup) return res.status(404).json({ message: 'Group not found' });

  const material = await Material.create({
    owner: req.userId,
    group,
    title: String(title),
    url: String(url),
    note: String(note),
  });
  res.status(201).json(material);
});

router.delete('/:id', async (req, res) => {
  const material = await Material.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!material) return res.status(404).json({ message: 'Material not found' });
  res.json({ message: 'Material deleted' });
});

export default router;