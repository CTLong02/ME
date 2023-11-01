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
    roomname: {
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
ElectricMeterShare.belongsTo(Room, {
  as: "room",
  foreignKey: { name: "roomId" },
});

Room.hasMany(ElectricMeter, {
  as: "electricMeters",
  foreignKey: { name: "roomId" },
});
ElectricMeter.belongsTo(Room, {
  as: "room",
  foreignKey: { name: "roomId" },
});

module.exports = Room;
