const Token = require("../models/Token");
const createAccessToken = async ({ accountId, token }) => {
  try {
    const accessToken = await Token.create({ accountId, token });
    return !!accessToken ? accessToken.dataValues : null;
  } catch (error) {
    return null;
  }
};

const deleteAccessToken = async (accountId) => {
  try {
    const accessToken = await Token.destroy({ where: { accountId } });
    return accessToken;
  } catch (error) {
    return null;
  }
};

module.exports = { createAccessToken, deleteAccessToken };
