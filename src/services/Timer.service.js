const Timer = require("../models/Timer");

const createTimer = async ({ electricMeterId, actionId, time, daily }) => {
  try {
    const timer = await Timer.create({
      electricMeterId,
      actionId,
      time,
      daily,
    });
    return timer ? timer.dataValues : null;
  } catch (error) {
    return null;
  }
};

const getTimersByEMId = async ({ electricMeterId }) => {
  try {
    const timers = await Timer.findAll({ where: { electricMeterId } });
    return timers ? timers.map((timer) => timer.dataValues) : [];
  } catch (error) {
    return [];
  }
};

const findTimer = async ({ electricMeterId, actionId, time, daily }) => {
  try {
    const timer = await Timer.findOne({
      where: { electricMeterId, actionId, time, daily },
    });
    return timer ? timer : null;
  } catch (error) {
    return null;
  }
};

const createTimers = async (data) => {
  try {
    const timers = await Timer.bulkCreate(data);
    return timers ? timers.map((timer) => timer.dataValues) : [];
  } catch (error) {
    return [];
  }
};

const deleteTimers = async (electricMeterId) => {
  try {
    const num = await Timer.destroy({ where: { electricMeterId } });
    return num;
  } catch (error) {
    return null;
  }
};

module.exports = {
  createTimer,
  getTimersByEMId,
  createTimers,
  deleteTimers,
  findTimer,
};
