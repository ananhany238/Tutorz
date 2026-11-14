const COMMON = new Set([
  'password1', 'password123', 'qwerty123', 'welcome1', 'admin123',
  'iloveyou1', 'letmein123', '12345678a', 'abc12345', 'passw0rd',
]);

// Returns a message describing the first broken rule, or null if the password is acceptable.
export function passwordProblem(password, { email = '' } = {}) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (Buffer.byteLength(password) > 72) return 'Password is too long (72 bytes maximum)';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
  if (!/\d/.test(password)) return 'Password must include a number';

  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return 'This password is too common';

  const local = String(email).split('@')[0].toLowerCase();
  if (local.length >= 4 && lower.includes(local)) return 'Password must not contain your email name';

  return null;
}