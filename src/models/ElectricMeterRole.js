const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const { ROLE_EM } = require("../config/constant/constant_model");
class ElectricMeterRole extends Model {}
ElectricMeterRole.init(
  {
    electricMeterRoleId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: [...Object.values(ROLE_EM)],
      defaultValue: ROLE_EM.read_only,
    },
  },
  {
    modelName: "ElectricMeterRole",
    sequelize,
  }
);

module.exports = ElectricMeterRole;
