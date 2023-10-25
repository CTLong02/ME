const Room = require("../models/Room");
const createRoom = async ({ name, homeId }) => {
  try {
    const room = await Room.create({ homeId, name });
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

const deleteRoom = async (roomId) => {
  try {
    const findedRoom = await findRoomByRoomId(roomId);
    if (findedRoom) {
      await Room.destroy({ where: { roomId } });
      return findedRoom;
    }
    return null;
  } catch (error) {
    return null;
  }
};

module.exports = { createRoom, findRoomByRoomId, deleteRoom };
