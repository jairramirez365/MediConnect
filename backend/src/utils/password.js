const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const keyLength = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, keyLength);

  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, salt, hash] = String(storedHash || '').split('$');

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false;
  }

  const derivedKey = await scrypt(password, salt, keyLength);
  const storedBuffer = Buffer.from(hash, 'hex');

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedKey);
}

module.exports = {
  hashPassword,
  verifyPassword
};
