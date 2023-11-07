const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
class Energy extends Model {}
Energy.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstValue: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    lastValue: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    hour: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    datetime: {
      type: DataTypes.DATEONLY,
    },
  },
  {
    modelName: "Energy",
    sequelize,
    indexes: [
      { fields: ["electricMeterId", "datetime"] },
      { fields: ["electricMeterId", "datetime", "hour"], unique: true },
    ],
  }
);

module.exports = Energy;
