const bcrypt = require('bcryptjs');

const myAdminPassword = 'adminpassword123'; 
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(myAdminPassword, salt);

console.log('--- HASHED PASSWORD BELOW ---');
console.log(hashedPassword); 
console.log('--- HASHED PASSWORD ABOVE ---');
