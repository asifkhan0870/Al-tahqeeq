// Prints a random secret you can paste into .env as JWT_SECRET.
console.log(require('crypto').randomBytes(48).toString('hex'));
