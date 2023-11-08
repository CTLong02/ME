const Room = require("../models/Room");
const Home = require("../models/Home");
const Account = require("../models/Account");

const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");

const renameRoom = async (req, res) => {
  try {
    const { roomname, roomId } = req.body;
    const { accountId } = req.account;
    if (!roomname) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const room = await Room.findOne({
      where: { roomId },
      include: {
        model: Home,
        as: "home",
        required: true,
        include: {
          model: Account,
          as: "account",
          required: true,
          where: { accountId },
        },
      },
    });
    if (!room) {
      return responseFailed(res, ResponseStatus.NOT_FOUND, "Nhà không tồn tại");
    }
    room.roomname = roomname;
    await room.save();
    const { home, ...roomData } = room.dataValues;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      room: roomData,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
  }
};

module.exports = { renameRoom };
