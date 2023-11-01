const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const ElectricMeterShare = require("./ElectricMeterShare");
const Notification = require("./Notification");
const Newscast = require("./Newscast");
const Timer = require("./Timer");
const ChangeTemperature = require("./ChangeTemperature");
const Invitation = require("./Invitation");
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
    electricMetername: {
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

ElectricMeter.hasMany(Newscast, {
  as: "newcasts",
  foreignKey: { name: "electricMeterId" },
});
Newscast.belongsTo(ElectricMeter, {
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
module.exports = ElectricMeter;
