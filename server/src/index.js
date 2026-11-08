import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import familyRoutes from './routes/family.js';

for (const key of ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL']) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();

// The app runs behind a proxy on most hosts, so use the real client IP for rate limiting.
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '100kb' }));

// Only failed attempts count (wrong passwords, invalid link codes), so normal use is never blocked.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many failed attempts, please try again in a few minutes' },
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/family', familyRoutes);

app.use((err, req, res, next) => {
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => console.log(`API running on port ${port}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });