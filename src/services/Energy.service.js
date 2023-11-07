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

const findEnergy = async ({ electricMeterId, hour, day, month, year }) => {
  try {
    const date = new Date(year, month, day);
    const energy = await Energy.findOne({
      where: { electricMeterId, hour, date },
    });
    return !!energy ? energy : null;
  } catch (error) {
    return null;
  }
};

module.exports = { createEnergy, findEnergy };
