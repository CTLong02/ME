const ElectricMeterRole = require("../models/ElectricMeterRole");
const createEMRole = async ({ role, accountId, electricMeterId, roomId }) => {
  try {
    const electricMeterRole = await ElectricMeterRole.create({
      role,
      accountId,
      electricMeterId,
      roomId,
    });
    return electricMeterRole.dataValues;
  } catch (error) {
    return null;
  }
};

module.exports = { createEMRole };
