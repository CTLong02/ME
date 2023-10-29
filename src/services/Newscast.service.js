const Newscast = require("../models/Newscast");
const ElectricMeter = require("../models/ElectricMeter");
const { Op } = require("sequelize");
const insertNewscast = async (data) => {
  try {
    const {
      ID,
      Conn,
      Signal,
      Strength,
      Voltage,
      Current,
      Power,
      Energy,
      Temp,
      Load,
      Update,
    } = data;
    await ElectricMeter.findOrCreate({
      where: { electricMeterId: ID },
      defaults: {
        electricMeterId: ID,
        ver: "1.0",
        net: "net",
        simImei: "123",
        conn: Conn,
        signal: Signal,
        strength: Strength,
        ssid: "123",
        pass: "123",
        rtc: 0,
      },
    });
    Newscast.create({
      electricMeterId: ID,
      conn: Conn.toString(),
      signal: Signal,
      strength: Strength,
      voltage: Voltage,
      current: Current,
      power: Power,
      energy: Energy,
      temp: Temp,
      load: Load,
      update: Update.toString(),
      datetime: moment(),
    });
  } catch (error) {}
};

const getLastNewscast = async (electricMeterId) => {
  try {
    const newscasts = await Newscast.findAll({
      where: { electricMeterId },
      order: [["datetime", "DESC"]],
      attributes: { exclude: ["updatedAt", "createdAt", "id"] },
    });
    return newscasts.length > 0 ? newscasts[0].dataValues : null;
  } catch (error) {
    return null;
  }
};

const getByDay = async ({ electricMeterId, day, month, year }) => {
  const newscasts = await Newscast.findAll({
    where: {
      [Op.and]: [],
    },
  });
};

module.exports = { insertNewscast, getLastNewscast };
