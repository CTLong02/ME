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

const getOnHour = async ({ electricMeterId, hour, day, month, year }) => {
  try {
    const startPreHour = new Date(year, month - 1, day, hour - 1);
    const start = new Date(year, month - 1, day, hour);
    const end = new Date(year, month - 1, day, hour + 1);
    const newcastsPreHour = await Newscast.findAll({
      where: {
        electricMeterId,
        datetime: {
          [Op.and]: {
            [Op.gte]: startPreHour,
            [Op.lt]: start,
          },
        },
      },
      order: [["datetime", "DESC"]],
    });
    const newscasts = await Newscast.findAll({
      where: {
        electricMeterId,
        datetime: {
          [Op.and]: {
            [Op.gte]: start,
            [Op.lt]: end,
          },
        },
      },
    });
    const addedNewscasts =
      newcastsPreHour.length > 0
        ? [newcastsPreHour[0], ...newscasts]
        : [...newscasts];
    return addedNewscasts.map((newscast) => newscast.dataValues);
  } catch (error) {
    return [];
  }
};

const getOnDay = async ({ electricMeterId, day, month, year }) => {
  try {
    const startPreDay = new Date(year, month - 1, day - 1);
    const start = new Date(year, month - 1, day);
    const end = new Date(year, month - 1, day + 1);
    const newcastsPreDay = await Newscast.findAll({
      where: {
        electricMeterId,
        datetime: {
          [Op.and]: {
            [Op.gte]: startPreDay,
            [Op.lt]: start,
          },
        },
      },
      order: [["datetime", "DESC"]],
    });
    const newscasts = await Newscast.findAll({
      where: {
        electricMeterId,
        datetime: {
          [Op.and]: {
            [Op.gte]: start,
            [Op.lt]: end,
          },
        },
      },
    });
    const addedNewscasts =
      newcastsPreDay.length > 0
        ? [newcastsPreDay[0], ...newscasts]
        : [...newscasts];
    return addedNewscasts.map((newscast) => newscast.dataValues);
  } catch (error) {
    return [];
  }
};

module.exports = { insertNewscast, getLastNewscast, getOnDay, getOnHour };
