const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const {
  TYPE_CONNECT_NUMBER,
  UPDATE_FIRMWARE_NUMBER,
} = require("../config/constant/constant_model");
class Newscast extends Model {}
Newscast.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conn: {
      type: DataTypes.ENUM,
      values: [...Object.values(TYPE_CONNECT_NUMBER)],
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
    update: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: [...Object.values(UPDATE_FIRMWARE_NUMBER)],
      defaultValue: UPDATE_FIRMWARE_NUMBER.not_update,
    },
    datetime: {
      type: DataTypes.DATE,
      defaultValue: new Date(Date.now()),
    },
  },
  {
    modelName: "Newscast",
    sequelize,
  }
);

module.exports = Newscast;
