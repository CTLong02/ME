const Home = require("../models/Hoom");
const createHome = async ({ accountId, name }) => {
  try {
    const home = await Home.create({ accountId, name });
    return home.dataValues;
  } catch (error) {
    return null;
  }
};
module.exports = { createHome };
