const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeter = require("./ElectricMeter");
class Room extends Model {}
Room.init(
  {
    roomId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    modelName: "Room",
    sequelize,
  }
);
Room.hasMany(ElectricMeter, { foreignKey: { name: "roomId" } });

module.exports = Room;
