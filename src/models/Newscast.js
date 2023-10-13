const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
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
      values: ["1", "2", "3"],
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
      values: ["0", "1", "2", "3"],
      defaultValue: "0",
    },
  },
  {
    modelName: "Newscast",
    sequelize,
  }
);

module.exports = Newscast;
