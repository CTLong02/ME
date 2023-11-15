const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
class Timer extends Model {}
Timer.init(
  {
    timerId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    actionId: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    time: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    daily: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    modelName: "Timer",
    timestamps: false,
    sequelize,
    indexes: [
      { fields: ["electricMeterId", "actionId"] },
      {
        fields: ["electricMeterId", "actionId", "time", "daily"],
      },
    ],
  }
);

module.exports = Timer;
