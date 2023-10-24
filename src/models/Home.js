const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const Room = require("./Room");
class Home extends Model {}
Home.init(
  {
    homeId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    modelName: "Home",
    sequelize,
  }
);
Home.hasMany(Room, { as: "rooms", foreignKey: { name: "homeId" } });
Room.belongsTo(Home, { as: "home", foreignKey: { name: "homeId" } });

module.exports = Home;
