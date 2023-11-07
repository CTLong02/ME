const Energy = require("../models/Energy");
const { Op } = require("sequelize");

const createEnergy = async ({ electricMeterId, firstValue }) => {
  try {
    const date = new Date();
    const hour = date.getHours();
    const energy = await Energy.create({
      electricMeterId,
      firstValue,
      lastValue: firstValue,
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

module.exports = { createEnergy, findEnergy, findEnergysByday };
