import crypto from 'crypto';

const WINDOW_MS = 30_000;

const sign = (secret, windowIndex) =>
  crypto.createHmac('sha256', secret).update(String(windowIndex)).digest('hex').slice(0, 16);

export const currentToken = (secret) => sign(secret, Math.floor(Date.now() / WINDOW_MS));

// Accept the current and the previous window, so a token lives 30 to 60 seconds.
export const isValidToken = (secret, token) => {
  const w = Math.floor(Date.now() / WINDOW_MS);
  return [w, w - 1].some((i) => sign(secret, i) === String(token));
};

export const secondsLeft = () => Math.ceil((WINDOW_MS - (Date.now() % WINDOW_MS)) / 1000);