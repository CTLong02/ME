const Room = require("../models/Room");
const Home = require("../models/Home");
const Account = require("../models/Account");
const createRoom = async ({ name, homeId }) => {
  try {
    const room = await Room.create({ homeId, name });
    return room.dataValues;
  } catch (error) {
    return null;
  }
};

const updateRoom = async ({ roomId, name, homeId }) => {
  try {
    const room = await Room.findOne({ where: roomId });
    room.name = name ? name : room.name;
    room.homeId = homeId ? homeId : room.homeId;
    await room.save();
    return room;
  } catch (error) {
    return homeId;
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

const checkRoomBelongAccount = async ({ roomId, accountId }) => {
  try {
    const room = await Room.findOne({
      where: { roomId },
      include: {
        model: Home,
        as: "home",
        required: true,
        include: {
          model: Account,
          as: "account",
          where: { accountId },
          required: true,
        },
      },
    });
    return !!room;
  } catch (error) {
    return false;
  }
};

const checkRoomBelongHome = async ({ roomId, homeId }) => {
  try {
    const room = await Room.findOne({
      where: { roomId },
      include: {
        model: Home,
        as: "home",
        required: true,
        where: { homeId },
      },
    });
    return !!room;
  } catch (error) {
    return false;
  }
};

const getRoomsByHomeId = async (homeId) => {
  try {
    const rooms = await Room.findAll({ where: { homeId } });
    return rooms;
  } catch (error) {
    return [];
  }
};

module.exports = {
  createRoom,
  updateRoom,
  findRoomByRoomId,
  deleteRoom,
  checkRoomBelongAccount,
  checkRoomBelongHome,
  getRoomsByHomeId,
};
