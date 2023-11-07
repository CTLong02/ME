const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    timezone: "+7:00",
  }
);

const conectDB = sequelize
  .authenticate()
  .then(() => {
    console.log("connect successfully!");
  })
  .catch((error) => {
    console.log("Error while conect database : ", error);
  });

const createTable = () => {
  const models = {};
  const modelFiles = fs.readdirSync(path.join(__dirname + "../../../models"));
  modelFiles.forEach((file) => {
    const model = require(path.join(__dirname + "../../../models/" + file));
    models[model.name] = model;
  });
  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  sequelize
    .sync({ force: false })
    .then(() => console.log("create table successfully!"))
    .catch((error) => console.log("Error while create tables :", error));
};

module.exports = { sequelize, conectDB, createTable };
