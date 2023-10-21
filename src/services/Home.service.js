const Home = require("../models/Home");
const createHome = async ({ accountId, name }) => {
  try {
    const home = await Home.create({ accountId, name });
    return home.dataValues;
  } catch (error) {
    return null;
  }
};
module.exports = { createHome };
