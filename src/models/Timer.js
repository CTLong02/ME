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
    daily: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    modelName: "Timer",
    timestamps: false,
    sequelize,
  }
);

module.exports = Timer;
