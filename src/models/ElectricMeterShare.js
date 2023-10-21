const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const { ROLE_EM } = require("../config/constant/constant_model");
class ElectricMeterShare extends Model {}
ElectricMeterShare.init(
  {
    electricMeterShareId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    roleShare: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: [...Object.values(ROLE_EM)],
      defaultValue: ROLE_EM.read_only,
    },
  },
  {
    modelName: "ElectricMeterShare",
    sequelize,
  }
);

module.exports = ElectricMeterShare;
