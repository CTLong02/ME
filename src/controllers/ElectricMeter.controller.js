const Account = require("../models/Account");
const Home = require("../models/Home");
const Room = require("../models/Room");
const ElectricMeter = require("../models/ElectricMeter");
const { createRoom } = require("../services/Room.service");
const { createHome } = require("../services/Home.service");
const { joinAccount } = require("../services/Account.service");
const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const {
  createEMShareForAnAccount,
} = require("../services/ElectricMeterShare.service");

// Thêm công tơ vào tài khoản
const addEM = async (req, res) => {
  try {
    const {
      electricMeterName,
      roomId,
      homeId,
      electricMeterId,
      roomname,
      homename,
    } = req.body;
    if (!roomId && !electricMeterId) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }

    if (!electricMeterId) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Thiếu mã công tơ số"
      );
    }

    const findedEM = await ElectricMeter.findOne({
      where: { electricMeterId },
    });
    if (!findedEM) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Không tìm thấy công tơ"
      );
    }

    if (!!findedEM.roomId) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Công tơ đã được kết nối với tài khoản khác"
      );
    }

    const account = await Account.findOne({
      where: { accountId: req.account.accountId },
      include: [
        {
          model: Home,
          as: "homes",
          attributes: { exclude: ["createdAt", "updatedAt"] },
          include: [
            {
              model: Room,
              as: "rooms",
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
          ],
        },
      ],
    });

    if (roomId) {
      const rooms = account.dataValues?.homes?.rooms.map((e) => e.roomId);
      if (rooms && Array.isArray(rooms) && rooms.includes(roomId)) {
        findedEM.roomId = roomId;
        findedEM.name = !!electricMeterName ? electricMeterName : findedEM.name;
        await findedEM.save();
        const newAccount = await joinAccount(req.account.accountId);
        return responseSuccess(res, ResponseStatus.SUCCESS, {
          homes: newAccount.homes,
        });
      }
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Bạn không sở hữu phòng này"
      );
    }

    if (homeId) {
      const homes = account.dataValues?.homes.map((e) => e.homeId);
      if (
        !homes ||
        !Array.isArray(homes) ||
        !homes.includes(Number.parseInt(homeId))
      ) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Bạn không sở hữu nhà này"
        );
      }
      const homeById = await Home.findOne({
        where: { homeId },
        include: [{ model: Room, as: "rooms" }],
      });
      const room = await createRoom({
        name: !!roomname
          ? roomname
          : `Phòng ${homeById.dataValues.rooms.length + 1}`,
        homeId,
      });

      findedEM.roomId = room.roomId;
      findedEM.name = !!electricMeterName ? electricMeterName : findedEM.name;
      await findedEM.save();
      const newAccount = await joinAccount(req.account.accountId);
      return responseSuccess(res, ResponseStatus.SUCCESS, {
        homes: newAccount.homes,
      });
    }

    const home = await createHome({
      accountId: req.account.accountId,
      name: !!homename
        ? homename
        : `Nhà ${account.dataValues?.homes.length + 1}`,
    });
    const room = await createRoom({
      name: !!roomname ? roomname : "Phòng 1",
      homeId: home.homeId,
    });
    findedEM.roomId = room.roomId;
    findedEM.name = !!electricMeterName ? electricMeterName : findedEM.name;
    await findedEM.save();
    const newAccount = await joinAccount(req.account.accountId);
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      homes: newAccount.homes,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

// Chia sẻ công tơ
const shareEm = async (req, res) => {
  try {
    const recipientAccount = req.recipientAccount;
    const em = req.em;
    const emShare = createEMShareForAnAccount({
      accountId: recipientAccount.accountId,
      electricMeterId: em.electricMeterId,
      homename: em.homename,
      roomname: em.roomname,
    });
    if (!emShare) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
    }
  } catch (error) {}
};

module.exports = { addEM, shareEm };
