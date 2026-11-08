import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

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