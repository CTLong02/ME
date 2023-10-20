const Home = require("../models/Hoom");
const createHome = async (name) => {
  const home = await Home.create({ name });
  return home.dataValues;
};
module.exports = { createHome };
