const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeterShare = require("./ElectricMeterShare");
const Notification = require("./Notification");
const Energy = require("./Energy");
const Timer = require("./Timer");
const ChangeTemperature = require("./ChangeTemperature");
const Invitation = require("./Invitation");
const EnergyChange = require("./EnergyChange");
const {
  TYPE_CONNECT,
  UPDATE_FIRMWARE,
} = require("../config/constant/constant_model");
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
    updateState: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: [...Object.values(UPDATE_FIRMWARE)],
      defaultValue: UPDATE_FIRMWARE.not_update,
    },
    ssid: {
      type: DataTypes.CHAR,
      allowNull: true,
      defaultValue: null,
    },
    pass: {
      type: DataTypes.CHAR,
      allowNull: true,
      defaultValue: null,
    },
    rtc: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    electricMetername: {
      type: DataTypes.CHAR,
      allowNull: false,
      defaultValue: "Smart Electric Meter",
    },
    macAddress: {
      type: DataTypes.CHAR,
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
  as: "electricMeterShares",
  foreignKey: { name: "electricMeterId" },
});
ElectricMeterShare.belongsTo(ElectricMeter, {
  as: "electricMeter",
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasMany(Notification, {
  as: "notifications",
  foreignKey: { name: "electricMeterId" },
});
Notification.belongsTo(ElectricMeter, {
  as: "electricMeter",
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasMany(Energy, {
  as: "energys",
  foreignKey: { name: "electricMeterId" },
});
Energy.belongsTo(ElectricMeter, {
  as: "electricMeter",
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasMany(Timer, {
  as: "timers",
  foreignKey: { name: "electricMeterId" },
});
Timer.belongsTo(ElectricMeter, {
  as: "electricMeter",
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasOne(ChangeTemperature, {
  as: "changeTemperature",
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasMany(Invitation, {
  foreignKey: { name: "electricMeterId" },
  as: "invitations",
});
Invitation.belongsTo(ElectricMeter, {
  as: "electricMeter",
  foreignKey: { name: "electricMeterId" },
});

ElectricMeter.hasMany(EnergyChange, {
  as: "energyChanges",
  foreignKey: { name: "electricMeterId" },
});
EnergyChange.belongsTo(ElectricMeter, {
  as: "electricMeter",
  foreignKey: { name: "electricMeterId" },
});
module.exports = ElectricMeter;
