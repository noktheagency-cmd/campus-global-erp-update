const { hashPassword } = require('../src/lib/auth/password');

// Generate password hash for admin123
const password = 'admin123';
const hash = hashPassword(password);

console.log('Generated password hash for "admin123":');
console.log(hash);
console.log('\nUse this hash in your SQL seed file or update the user directly.');
