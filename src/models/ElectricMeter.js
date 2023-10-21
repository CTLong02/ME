const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeterShare = require("./ElectricMeterShare");
const Notification = require("./Notification");
const Newscast = require("./Newscast");
const Timer = require("./Timer");
const ChangeTemperature = require("./ChangeTemperature");
const { TYPE_CONNECT } = require("../config/constant/constant_model");
class ElectricMeter extends Model {}
ElectricMeter.init(
  {
    electricMeterId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    ver: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    net: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    simImei: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conn: {
      type: DataTypes.ENUM,
      values: [...Object.values(TYPE_CONNECT)],
      allowNull: false,
    },
    signal: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    strength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    ssid: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    pass: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    rtc: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Smart Electric Meter",
    },
    macAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "00-00-00-00-00-00",
    },
  },
  {
    modelName: "ElectricMeter",
    sequelize,
  }
);

ElectricMeter.hasMany(ElectricMeterShare, {
  as: "electricMeterShare",
  foreignKey: { name: "electricMeterId" },
});
ElectricMeter.hasMany(Notification, {
  as: "notification",
  foreignKey: { name: "electricMeterId" },
});
ElectricMeter.hasMany(Newscast, { foreignKey: { name: "electricMeterId" } });
ElectricMeter.hasMany(Timer, { foreignKey: { name: "electricMeterId" } });
ElectricMeter.hasOne(ChangeTemperature, {
  foreignKey: { name: "electricMeterId" },
});
module.exports = ElectricMeter;
