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
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    modelName: "ElectricMeterShare",
    timestamps: false,
    sequelize,
  }
);

module.exports = ElectricMeterShare;
