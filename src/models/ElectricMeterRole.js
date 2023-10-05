const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
class ElectricMeterRole extends Model {}
ElectricMeterRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    roleCode: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ["0", "1", "2"],
      defaultValue: "0",
    },
  },
  {
    modelName: "ElectricMeterRole",
    sequelize,
  }
);

module.exports = ElectricMeterRole;
