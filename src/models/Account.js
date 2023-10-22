const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeterShare = require("./ElectricMeterShare");
const Home = require("./Home");
const Token = require("./Token");
const { ACCOUNT_LEVEL } = require("../config/constant/constant_model");
class Account extends Model {}
Account.init(
  {
    accountId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      unique: true,
    },
    pass: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      unique: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    level: {
      type: DataTypes.ENUM,
      values: [...Object.values(ACCOUNT_LEVEL)],
      allowNull: false,
      defaultValue: ACCOUNT_LEVEL.user,
    },
  },
  {
    modelName: "Account",
    sequelize,
  }
);

Account.hasMany(Home, { as: "homes", foreignKey: { name: "accountId" } });
Account.hasOne(Token, { as: "token", foreignKey: { name: "accountId" } });

module.exports = Account;
