import crypto from 'crypto';

export const makeLinkCode = () => crypto.randomBytes(6).toString('hex').toUpperCase();