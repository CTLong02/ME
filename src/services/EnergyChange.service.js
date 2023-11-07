const EnergyChange = require("../models/EnergyChange");
const { Op } = require("sequelize");

const createEnergyChange = async ({ electricMeterId, preValue, curValue }) => {
  try {
    const energyChange = await EnergyChange.create({
      electricMeterId,
      preValue,
      curValue,
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
      order: [["datetime", "DESC"]],
    });
    return energyChanges.length > 0 ? energyChanges[0].dataValues : null;
  } catch (error) {
    return null;
  }
};

const getEnergyChangesByDate = async ({
  electricMeterId,
  fromDate,
  toDate,
}) => {
  try {
    const energyChanges = await EnergyChange.findAll({
      where: {
        electricMeterId,
        datetime: {
          [Op.and]: [{ [Op.gte]: fromDate }, { [Op.lt]: toDate }],
        },
      },
    });
    return energyChanges;
  } catch (error) {
    return [];
  }
};

module.exports = {
  createEnergyChange,
  getLastEnergyChange,
  getEnergyChangesByDate,
};
