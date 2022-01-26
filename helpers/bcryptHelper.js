const bcrypt = require('bcryptjs');
// sets salt to be used in multiple files
const salt = bcrypt.genSaltSync(10);

module.exports = {bcrypt, salt};