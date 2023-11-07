const EnergyChange = require("../models/EnergyChange");

const createEnergyChange = async ({ electricMeterId, preValue, valueCur }) => {
  try {
    const energyChange = await EnergyChange.create({
      electricMeterId,
      preValue,
      valueCur,
    });
    return !!energyChange ? energyChange : null;
  } catch (error) {
    return null;
  }
};

const getLastEnergyChange = async (electricMeterId) => {
  try {
    const energyChanges = await EnergyChange.findAll({
      where: { electricMeterId },
      order: [["createdAt", "DESC"]],
    });
    return energyChanges.length > 0 ? energyChanges[0].dataValues : null;
  } catch (error) {
    return null;
  }
};

module.exports = { createEnergyChange, getLastEnergyChange };
