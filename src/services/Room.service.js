const Room = require("../models/Room");
const createRoom = async ({ name, hoomId }) => {
  try {
    const room = await Room.create({ hoomId, name });
    return room.dataValues;
  } catch (error) {
    return null;
  }
};

const findRoomByRoomId = async (roomId) => {
  try {
    const room = await Room.findOne({ where: { roomId } });
    return room.dataValues;
  } catch (error) {
    return null;
  }
};

module.exports = { createRoom, findRoomByRoomId };
