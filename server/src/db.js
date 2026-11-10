import mongoose from 'mongoose';

let connecting = null;

export function connectDb() {
  const state = mongoose.connection.readyState;
  if (state === 1) return Promise.resolve();
  if (state === 2 && connecting) return connecting;

  connecting = mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
    .catch((err) => {
      connecting = null;
      throw err;
    });
  return connecting;
}