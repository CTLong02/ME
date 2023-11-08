const Energy = require("../models/Energy");
const { Op } = require("sequelize");
const { startOfMonth, endOfMonth } = require("date-fns");

const createEnergy = async ({ electricMeterId, firstValue, lastValue }) => {
  try {
    const date = new Date();
    const hour = date.getHours();
    const energy = await Energy.create({
      electricMeterId,
      firstValue,
      lastValue,
      hour,
      date,
    });
    return !!energy ? energy : null;
  } catch (error) {
    return null;
  }
};

const findEnergy = async ({ electricMeterId, hour, date }) => {
  try {
    const energy = await Energy.findOne({
      where: { electricMeterId, hour, date },
    });
    return !!energy ? energy : null;
  } catch (error) {
    return null;
  }
};

const findEnergysByday = async ({ electricMeterId, date }) => {
  try {
    const energys = await Energy.findAll({
      where: { electricMeterId, date },
    });
    return energys;
  } catch (error) {
    return [];
  }
};

const findFirstEnergyOnDay = async ({ electricMeterId, date }) => {
  try {
    const minHour = await Energy.min("hour", {
      where: { electricMeterId, date },
    });
    const energy = await Energy.findOne({
      where: { electricMeterId, hour: minHour, date },
    });
    return !!energy ? energy : null;
  } catch (error) {
    return null;
  }
};

const findLastEnergyOnDay = async ({ electricMeterId, date }) => {
  try {
    const maxHour = await Energy.max("hour", {
      where: { electricMeterId, date },
    });
    const energy = await Energy.findOne({
      where: { electricMeterId, hour: maxHour, date },
    });
    return !!energy ? energy : null;
  } catch (error) {
    return null;
  }
};

const getAllEnergyOnMonth = async ({ electricMeterId, date }) => {
  try {
    const startOfMonthDate = startOfMonth(date);
    const endOfMonthDate = endOfMonth(date);
    const energys = await Energy.findAll({
      where: {
        electricMeterId,
        date: {
          [Op.between]: [startOfMonthDate, endOfMonthDate],
        },
      },
    });
    return energys ? energys.map((energy) => energy.dataValues) : [];
  } catch (error) {
    return [];
  }
};

module.exports = {
  createEnergy,
  findEnergy,
  findEnergysByday,
  findFirstEnergyOnDay,
  findLastEnergyOnDay,
  getAllEnergyOnMonth,
  getAllEnergyOnMonth,
};
