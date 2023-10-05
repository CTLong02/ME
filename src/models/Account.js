const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeterRole = require("./ElectricMeterRole");
class Account extends Model {}
Account.init(
  {
    id: {
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
      values: ["0", "1", "2", "3"],
      allowNull: false,
      defaultValue: "0",
    },
  },
  {
    modelName: "Account",
    sequelize,
  }
);

Account.hasMany(ElectricMeterRole, { foreignKey: { name: "accountId" } });
ElectricMeterRole.belongsTo(Account, { foreignKey: { name: "accountId" } });

module.exports = Account;
