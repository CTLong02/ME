const Token = require("../models/Token");
const createAccessToken = async ({ accountId, token }) => {
  try {
    const accessToken = await Token.create({ accountId, token });
    return !!accessToken ? accessToken.dataValues : null;
  } catch (error) {
    return null;
  }
};

module.exports = { createAccessToken };
