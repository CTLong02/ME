const jwt = require("jsonwebtoken");
const constantTime = require("../config/constant/constant_time");
const createToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_KEY, {
    expiresIn: `${constantTime.TIME_TOKEN}ms`,
  });
  return token;
};
