const { Op } = require("sequelize");
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

const deleteAllTimers = async (electricMeterId) => {
  try {
    const num = await Timer.destroy({ where: { electricMeterId } });
    return num;
  } catch (error) {
    return null;
  }
};

const deleteTimers = async ({ electricMeterId, timers }) => {
  try {
    const num = await Timer.destroy({
      where: {
        electricMeterId,
        [Op.or]: [
          ...timers.map((timer) => {
            const { time, daily, actionId } = timer;
            return { [Op.and]: [{ time }, { daily }, { actionId }] };
          }),
        ],
      },
    });
    return num;
  } catch (error) {
    return null;
  }
};

module.exports = {
  createTimer,
  getTimersByEMId,
  createTimers,
  deleteAllTimers,
  deleteTimers,
  findTimer,
};
