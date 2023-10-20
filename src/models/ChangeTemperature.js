const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
class ChangeTemperature extends Model {}
ChangeTemperature.init(
  {
    changeTemperatureId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    actionId: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    maxValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    modelName: "ChangeTemperature",
    sequelize,
  }
);

module.exports = ChangeTemperature;
