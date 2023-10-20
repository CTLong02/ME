const Room = require("../models/Room");
const createRoom = async (name) => {
  const room = await Room.create({ name });
  return room.dataValues;
};
module.exports = { createRoom };
