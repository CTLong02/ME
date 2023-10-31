const Home = require("../models/Home");
const Account = require("../models/Account");
const createHome = async ({ accountId, name }) => {
  try {
    const home = await Home.create({ accountId, name });
    return home.dataValues;
  } catch (error) {
    return null;
  }
};

const deleteHome = async (homeId) => {
  try {
    const findedHome = await findHome(homeId);
    if (findedHome) {
      await Home.destroy({ where: { homeId } });
      return findedHome;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const findHome = async (homeId) => {
  try {
    const home = await Home.findOne({ where: { homeId } });
    return !!home ? home.dataValues : null;
  } catch (error) {
    return null;
  }
};

const getHomesByAccountId = async (accountId) => {
  try {
    const homes = await Home.findAll({ where: { accountId } });
    return homes;
  } catch (error) {
    return [];
  }
};

const checkHomeBelongAccount = async ({ homeId, accountId }) => {
  try {
    const home = await Home.findOne({
      where: { homeId },
      include: {
        model: Account,
        as: "account",
        required: true,
        where: { accountId },
      },
    });
    return !!home;
  } catch (error) {
    return false;
  }
};

module.exports = {
  createHome,
  findHome,
  deleteHome,
  getHomesByAccountId,
  checkHomeBelongAccount,
};
