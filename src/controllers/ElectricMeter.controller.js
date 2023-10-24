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
const TIME = require("../config/constant/constant_time");
const ResponseStatus = require("../config/constant/response_status");
const { ROLE_EM } = require("../config/constant/constant_model");
const {
  createEMShareForAnAccount,
  findShareAccountsByEMId,
  findShareAccountByEMId,
  deleteEMShare,
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
    const { roleShare } = req.body;
    if (!roleShare || !Object.values(ROLE_EM).includes(roleShare)) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Sai tham số quyền truy cập"
      );
    }

    const recipientAccount = req.recipientAccount;
    const em = req.em;

    const shareAccount = await findShareAccountByEMId(
      em.electricMeterId,
      recipientAccount.accountId
    );
    if (shareAccount) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Yều cầu đã tồn tại"
      );
    }

    const emShare = await createEMShareForAnAccount({
      accountId: recipientAccount.accountId,
      electricMeterId: em.electricMeterId,
      homename: em.homename,
      roomname: em.roomname,
      roleShare,
    });
    if (!emShare) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
    }
    const sharedAccounts = await findShareAccountsByEMId(em.electricMeterId);

    // Sau thời gian TIME_SHARE_REQUEST mà sự chia sẻ chưa được chấp nhận thì xóa
    setTimeout(async () => {
      const shareAccount = await findShareAccountByEMId(
        em.electricMeterId,
        recipientAccount.accountId
      );
      if (!!shareAccount && shareAccount.accepted === 0) {
        deleteEMShare(em.electricMeterId, recipientAccount.accountId);
      }
    }, TIME.TIME_SHARE_REQUEST);
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      sharedAccounts,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

//Chấp nhận chia sẻ
const acceptEmShare = async (req, res) => {
  try {
  } catch (error) {}
};

module.exports = { addEM, shareEm, acceptEmShare };
