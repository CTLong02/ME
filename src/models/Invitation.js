const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const { ROLE_EM } = require("../config/constant/constant_model");
class Invitation extends Model {}
Invitation.init(
  {
    invitationId: {
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
    datetime: {
      type: DataTypes.DATE,
      defaultValue: new Date(Date.now()),
    },
    roomname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    homename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    modelName: "Invitation",
    sequelize,
  }
);

module.exports = Invitation;
