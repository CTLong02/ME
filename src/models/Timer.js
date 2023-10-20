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
      type: DataTypes.ENUM,
      values: ["0", "1"],
      allowNull: false,
    },
    daily: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    datetime: {
      type: DataTypes.DATE,
    },
  },
  {
    modelName: "Timer",
    sequelize,
  }
);

module.exports = Timer;
