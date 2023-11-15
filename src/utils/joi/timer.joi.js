const { TIMER_ACTION } = require("../../config/constant/constant_model");
const { TIME_MAX_ON_DAY } = require("../../config/constant/constant_time");
const Joi = require("joi");
const createTimerDTO = Joi.object({
  action: Joi.string()
    .valid(...Object.values(TIMER_ACTION))
    .required(),
  time: Joi.number().integer().min(0).max(TIME_MAX_ON_DAY).required(),
  daily: Joi.number().integer().min(1).max(128).required(),
});

const updateTimerDTO = Joi.object({
  action: Joi.string().valid(...Object.values(TIMER_ACTION)),
  time: Joi.number().integer().min(0).max(TIME_MAX_ON_DAY),
  daily: Joi.number().integer().min(1).max(128),
});

const deleteTimersDTO = Joi.object({
  timerId: Joi.number().required(),
});

module.exports = { createTimerDTO, updateTimerDTO, deleteTimersDTO };
