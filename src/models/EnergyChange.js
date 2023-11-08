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
    preValue: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    curValue: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    datetime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    modelName: "EnergyChange",
    timestamps: false,
    sequelize,
    indexes: [{ fields: ["electricMeterId", "datetime"], unique: true }],
  }
);

module.exports = EnergyChange;
