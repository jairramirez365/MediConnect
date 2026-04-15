const { hashPassword } = require('../src/utils/password');

const passwords = process.argv.slice(2);

if (passwords.length === 0) {
  console.error('Usage: node scripts/hash-password.js <password> [password...]');
  process.exit(1);
}

Promise.all(passwords.map((password) => hashPassword(password)))
  .then((hashes) => {
    hashes.forEach((hash) => console.log(hash));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
