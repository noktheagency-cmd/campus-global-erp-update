const crypto = require('crypto');

function hashPassword(password) {
  const passwordHashLength = 64;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, passwordHashLength).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

const password = 'admin123';
const hash = hashPassword(password);

console.log('Password: admin123');
console.log('Hash:', hash);
