import 'dotenv/config';
import app from './app.js';
import { connectDb } from './db.js';

for (const key of ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL']) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => console.log(`API running on port ${port}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });