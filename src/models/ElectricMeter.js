const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeterRole = require("./ElectricMeterRole");
const Notification = require("./Notification");
const Newscast = require("./Newscast");
const Timer = require("./Timer");
const ChangeTemperature = require("./ChangeTemperature");
class ElectricMeter extends Model {}
ElectricMeter.init(
  {
    id: {
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
      values: ["1", "2", "3"],
      allowNull: false,
    },
    signal: {
      type: DataTypes.ENUM,
      values: ["1", "2", "3", "4"],
      allowNull: true,
      defaultValue: null,
    },
    strength: {
      type: DataTypes.ENUM,
      values: ["1", "2", "3", "4"],
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
    room: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "my room",
    },
    home: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "my home",
    },
    current: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    voltage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    power: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    energy: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    temp: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    load: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    update: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ["0", "1", "2", "3"],
      defaultValue: "0",
    },
  },
  {
    modelName: "ElectricMeter",
    sequelize,
  }
);

ElectricMeter.hasMany(ElectricMeterRole, {
  foreignKey: { name: "electricMeterId" },
});
ElectricMeterRole.belongsTo(ElectricMeter, {
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasMany(Notification, {
  foreignKey: { name: "electricMeterId" },
});
Notification.belongsTo(ElectricMeter, {
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasMany(Newscast, { foreignKey: { name: "electricMeterId" } });
Newscast.belongsTo(ElectricMeter, {
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasMany(Timer, { foreignKey: { name: "electricMeterId" } });
Timer.belongsTo(ElectricMeter, {
  foreignKey: { name: "electricMeterId" },
});
ElectricMeter.hasOne(ChangeTemperature, {
  foreignKey: { name: "electricMeterId" },
});
module.exports = ElectricMeter;
