const {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} = require("date-fns");
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

const getEnergyChangesOnDay = async ({ electricMeterId, datetime }) => {
  try {
    const dateStartOfDay = startOfDay(datetime);
    const dateEndOfDay = endOfDay(datetime);
    const energyChanges = await EnergyChange.findAll({
      where: {
        electricMeterId,
        datetime: { [Op.between]: [dateStartOfDay, dateEndOfDay] },
      },
    });
    return energyChanges
      ? energyChanges.map((energyChange) => energyChange.dataValues)
      : [];
  } catch (error) {
    return [];
  }
};

const getEnergyChangesOnMonth = async ({ electricMeterId, datetime }) => {
  try {
    const dateStartOfMonth = startOfMonth(datetime);
    const dateEndOfMonth = endOfMonth(datetime);
    const energyChanges = await EnergyChange.findAll({
      where: {
        electricMeterId,
        datetime: { [Op.between]: [dateStartOfMonth, dateEndOfMonth] },
      },
    });
    return energyChanges
      ? energyChanges.map((energyChange) => energyChange.dataValues)
      : [];
  } catch (error) {
    return [];
  }
};

const getEnergyChangesOnYear = async ({ electricMeterId, datetime }) => {
  try {
    const dateStartOfYear = startOfYear(datetime);
    const dateEndOfYear = endOfYear(datetime);
    const energyChanges = await EnergyChange.findAll({
      where: {
        electricMeterId,
        datetime: { [Op.between]: [dateStartOfYear, dateEndOfYear] },
      },
    });
    return energyChanges
      ? energyChanges.map((energyChange) => energyChange.dataValues)
      : [];
  } catch (error) {
    return [];
  }
};

module.exports = {
  createEnergyChange,
  getLastEnergyChange,
  getEnergyChangesByDate,
  getEnergyChangesOnDay,
  getEnergyChangesOnMonth,
  getEnergyChangesOnYear,
};
