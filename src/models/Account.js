const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeterRole = require("./ElectricMeterRole");
const Home = require("./Hoom");
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

Account.hasMany(ElectricMeterRole, { foreignKey: { name: "accountId" } });
ElectricMeterRole.belongsTo(Account, { foreignKey: { name: "accountId" } });
Account.hasMany(Home, { foreignKey: { name: "accountId" } });

module.exports = Account;
