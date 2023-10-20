const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database/connect");
const { TYPE_NOTIFICATION } = require("../config/constant/constant_model");
class Notification extends Model {}
Notification.init(
  {
    notificationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    datetime: DataTypes.DATE,
    type: {
      type: DataTypes.ENUM,
      values: [...Object.values(TYPE_NOTIFICATION)],
      allowNull: false,
    },
    readed: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
  },
  {
    modelName: "Notification",
    sequelize,
  }
);

module.exports = Notification;
