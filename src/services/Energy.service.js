const Energy = require("../models/Energy");
const { Op } = require("sequelize");

const createEnergy = async ({ electricMeterId, firstValue }) => {
  try {
    const datetime = new Date();
    const hour = datetime.getHours();
    const energy = await Energy.create({
      electricMeterId,
      firstValue,
      lastValue: firstValue,
      hour,
      datetime,
    });
    return !!energy ? energy : null;
  } catch (error) {
    return null;
  }
};

const findEnergy = async ({ electricMeterId, hour, day, month, year }) => {
  try {
    const datetime = new Date(year, month, day);
    const energy = await Energy.findOne({
      where: { electricMeterId, hour, datetime },
    });
    return !!energy ? energy : null;
  } catch (error) {
    return null;
  }
};

module.exports = { createEnergy, findEnergy };
