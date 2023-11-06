const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
class EnergyChange extends Model {}
EnergyChange.init(
  {
    energyChangeId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    volume: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  },
  {
    modelName: "EnergyChange",
    sequelize,
  }
);

module.exports = EnergyChange;
