const bcrypt = require("bcrypt");
const saltRounds = 2;

const hashOtp = (sOtp) => {
  return bcrypt.hashSync(sOtp, saltRounds);
};

const compareOtp = (comparativeNeededOtp, hash) => {
  return bcrypt.compareSync(comparativeNeededOtp, hash);
};

const hashPw = (password) => {
  return bcrypt.hashSync(password, saltRounds);
};

const comparePw = (comparativeNeededpassword, hash) => {
  return bcrypt.compareSync(comparativeNeededpassword, hash);
};

module.exports = { hashPw, comparePw, hashOtp, compareOtp };
