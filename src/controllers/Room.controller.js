const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const Room = require("../models/Room");
const Home = require("../models/Home");
const Account = require("../models/Account");
const renameRoom = async (req, res) => {
  try {
    const { name, roomId } = req.body;
    const { accountId } = req.account;
    if (!name) {
      responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
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
    room.name = name;
    await room.save();
    const { home, createdAt, updatedAt, ...roomData } = room.dataValues;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      room: roomData,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
  }
};

module.exports = { renameRoom };
