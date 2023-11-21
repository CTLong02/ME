const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
class Otp extends Model {}
Otp.init(
  {
    otpId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
    },
    hashedOtp: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    modelName: "Otp",
    sequelize,
    timestamps: false,
  }
);

module.exports = Otp;
