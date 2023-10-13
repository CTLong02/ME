const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const Room = require("./Room");
class Hoom extends Model {}
Hoom.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    modelName: "Hoom",
    sequelize,
  }
);
Hoom.hasMany(Room, { foreignKey: { name: "hoomId" } });

module.exports = Hoom;
