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
    date: {
      type: DataTypes.DATEONLY,
    },
  },
  {
    modelName: "Energy",
    sequelize,
    timestamps: false,
    indexes: [
      { fields: ["electricMeterId", "date"] },
      { fields: ["electricMeterId", "date", "hour"], unique: true },
    ],
  }
);

module.exports = Energy;
