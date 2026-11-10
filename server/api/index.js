import app from '../src/app.js';
import { connectDb } from '../src/db.js';

export default async function handler(req, res) {
  try {
    await connectDb();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    return res.status(500).json({ message: 'Database unavailable' });
  }
  return app(req, res);
}