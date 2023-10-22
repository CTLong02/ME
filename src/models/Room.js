const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeterShare = require("./ElectricMeterShare");
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
Room.hasMany(ElectricMeterShare, {
  as: "electricMeterShares",
  foreignKey: { name: "roomId" },
});
Room.hasMany(ElectricMeter, {
  as: "electricMeters",
  foreignKey: { name: "roomId" },
});

module.exports = Room;
