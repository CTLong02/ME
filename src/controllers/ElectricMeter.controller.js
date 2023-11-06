const { differenceInMilliseconds } = require("date-fns");
const Account = require("../models/Account");
const Home = require("../models/Home");
const Room = require("../models/Room");
const ElectricMeter = require("../models/ElectricMeter");
const Newscast = require("../models/Newscast");
const { getDaysInMonth } = require("date-fns");
const {
  createRoom,
  checkRoomBelongAccount,
} = require("../services/Room.service");
const { createHome } = require("../services/Home.service");
const {
  getLastNewscast,
  getOnDay,
  getOnHour,
} = require("../services/Newscast.service");
const { joinAccount } = require("../services/Account.service");
const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const TIME = require("../config/constant/constant_time");
const ResponseStatus = require("../config/constant/response_status");
const { ROLE_EM } = require("../config/constant/constant_model");
const { EM_ROLES } = require("../config/constant/contants_app");
const { UPDATE_FIRMWARE } = require("../config/constant/constant_model");
const { handleUpdateFirmware } = require("../utils/helper/AppHelper");
const moment = require("moment");
const {
  findSharedEmsByAccountId,
  findAccountByEMShareId,
  createEMShareForAnAccount,
  deleteSharedAccounts,
} = require("../services/ElectricMeterShare.service");
const {
  createInvitation,
  findInvitationByEMIdAndAccoutId,
  deleteInvitation,
  deleteInvitations,
} = require("../services/Invitation.service");
const {
  findEMsByAcountId,
  findEMById,
  updateEm,
  getAccountSharedListByEMId,
} = require("../services/ElectricMeter.service");

// Thêm công tơ vào tài khoản
const addEM = async (req, res) => {
  try {
    const {
      electricMetername,
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
      const iRoomId = Number.parseInt(roomId.toString());
      const rooms = account.dataValues?.homes.reduce((acc, home) => {
        const { rooms } = home.dataValues;
        const roomIds = rooms.map((room) => room.roomId);
        return [...acc, ...roomIds];
      }, []);

      if (rooms && Array.isArray(rooms) && rooms.includes(iRoomId)) {
        findedEM.roomId = iRoomId;
        findedEM.electricMetername = !!electricMetername
          ? electricMetername
          : findedEM.electricMetername;
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
      const iHomeId = Number.parseInt(homeId.toString());
      const homes = account.dataValues?.homes.map((e) => e.homeId);
      if (
        !homes ||
        !Array.isArray(homes) ||
        !homes.includes(Number.parseInt(iHomeId))
      ) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Bạn không sở hữu nhà này"
        );
      }
      const homeById = await Home.findOne({
        where: { homeId: iHomeId },
        include: [{ model: Room, as: "rooms" }],
      });
      const room = await createRoom({
        roomname: !!roomname
          ? roomname
          : `Phòng ${homeById.dataValues.rooms.length + 1}`,
        homeId,
      });

      findedEM.roomId = room.roomId;
      findedEM.electricMetername = !!electricMetername
        ? electricMetername
        : findedEM.electricMetername;
      await findedEM.save();
      const newAccount = await joinAccount(req.account.accountId);
      return responseSuccess(res, ResponseStatus.SUCCESS, {
        homes: newAccount.homes,
      });
    }

    const home = await createHome({
      accountId: req.account.accountId,
      homename: !!homename
        ? homename
        : `Nhà ${account.dataValues?.homes.length + 1}`,
    });
    const room = await createRoom({
      roomname: !!roomname ? roomname : "Phòng 1",
      homeId: home.homeId,
    });
    findedEM.roomId = room.roomId;
    findedEM.electricMetername = !!electricMetername
      ? electricMetername
      : findedEM.electricMetername;
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

    const { accountId } = req.recipientAccount;
    const { electricMeterId, roomname, homename } = req.em;

    const share = await findAccountByEMShareId(electricMeterId, accountId);
    if (share) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Tài khoản này đã được chia sẻ"
      );
    }

    const invitaton = await findInvitationByEMIdAndAccoutId({
      electricMeterId,
      accountId,
    });
    if (invitaton) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Yều cầu đã tồn tại"
      );
    }

    await createInvitation({
      electricMeterId,
      accountId,
      roomname,
      homename,
      roleShare,
    });

    setTimeout(() => {
      deleteInvitation({ electricMeterId, accountId });
    }, TIME.TIME_SHARE_REQUEST);

    return responseSuccess(res, ResponseStatus.SUCCESS, {});
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

//Chấp nhận chia sẻ
const acceptEmShare = async (req, res) => {
  try {
    const { electricMeterId } = req.em;
    const { accountId } = req.account;
    const invitaton = await findInvitationByEMIdAndAccoutId({
      electricMeterId,
      accountId,
    });
    if (!invitaton) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Bạn không được yêu cầu"
      );
    }

    const timeDistance = differenceInMilliseconds(
      invitaton.dataValues.datetime,
      new Date(Date.now())
    );

    if (timeDistance > TIME.TIME_SHARE_REQUEST) {
      await deleteInvitation({ electricMeterId, accountId });
      return responseFailed(res, ResponseStatus.NOT_FOUND, "Hết hiệu lực");
    }

    const { roomname, homename, roleShare } = invitaton.dataValues;
    const emShare = await createEMShareForAnAccount({
      accountId,
      electricMeterId,
      roomname,
      homename,
      roleShare,
    });
    if (emShare) {
      await deleteInvitation({ electricMeterId, accountId });
      return responseSuccess(res, ResponseStatus.SUCCESS);
    }
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

//Từ chối chia sẻ
const rejectEMShare = async (req, res) => {
  try {
    const { electricMeterId } = req.em;
    const { accountId } = req.account;
    const invitaton = await findInvitationByEMIdAndAccoutId({
      electricMeterId,
      accountId,
    });
    if (!invitaton) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Bạn không được yêu cầu hoặc yêu cầu đã hết hạn"
      );
    }
    await deleteInvitation({ electricMeterId, accountId });
    return responseSuccess(res, ResponseStatus.SUCCESS);
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

// Lấy các thiết bị (cả sở hữu và được chia sẻ)
const getEms = async (req, res) => {
  try {
    const { accountId } = req.account;
    const roomId = req.query?.roomId
      ? Number.parseInt(req.query?.roomId)
      : null;
    const homeId = req.query?.homeId
      ? Number.parseInt(req.query?.homeId)
      : null;
    const ownEMs = await findEMsByAcountId({ roomId, homeId, accountId });
    const sharedEms = await findSharedEmsByAccountId({
      roomId,
      homeId,
      accountId,
    });
    const ems = [];
    const lOwnEms = ownEMs.length;
    const lSharedEms = sharedEms.length;
    let i = 0;
    let j = 0;
    while (i < lOwnEms || j < lSharedEms) {
      if (i < lOwnEms && j < lSharedEms) {
        const { acceptedAt, ...shareEm } = sharedEms[j];
        if (ownEMs[i].createdAt < acceptedAt) {
          ems.push(ownEMs[i]);
          i++;
        } else {
          ems.push(shareEm);
          j++;
        }
      } else if (i < lOwnEms) {
        ems.push(ownEMs[i]);
        i++;
      } else {
        const { acceptedAt, ...shareEm } = sharedEms[j];
        ems.push(shareEm);
        j++;
      }
    }
    responseSuccess(res, ResponseStatus.SUCCESS, {
      electricMeters: [
        ...ems.map((em) => {
          const { room, ...value } = em;
          return value;
        }),
      ],
    });
  } catch (error) {
    responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

//Thêm lịch tình
const addTimer = async (req, res) => {
  try {
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

// Xem chi tiết chỉ số công tơ
const viewDetailEm = async (req, res) => {
  try {
    const em = req.em;
    const emInfor = await findEMById(em.electricMeterId);
    const lastNewscast = await getLastNewscast(em.electricMeterId);
    if (!lastNewscast) {
      const emptyNewscast = {
        current: 0,
        voltage: 0,
        power: 0,
        energy: 0,
        temp: 0,
        load: 1,
        update: UPDATE_FIRMWARE.not_update,
        datetime: moment().format("LTS"),
      };
      responseSuccess(res, ResponseStatus.SUCCESS, {
        electricMeter: { ...emptyNewscast, ...emInfor },
      });
    }
    responseSuccess(res, ResponseStatus.SUCCESS, {
      electricMeter: {
        ...lastNewscast,
        update: handleUpdateFirmware(lastNewscast.update),
        ...emInfor,
      },
    });
  } catch (error) {
    responseFailed(res, ResponseStatus.BAD_GATEWAY, "Lỗi server");
  }
};

// Báo cáo công tơ theo ngày
const viewReportByDay = async (req, res) => {
  try {
    const { day, month, year } = req.query;
    const em = req.em;
    if (!day || !month || !year) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const iDay = Number.parseInt(day);
    const iMonth = Number.parseInt(month);
    const iYear = Number.parseInt(year);
    const statistics = [];
    for (let i = 0; i <= 23; i++) {
      const newcastsOnHour = await getOnHour({
        electricMeterId: em.electricMeterId,
        hour: i,
        day: iDay,
        month: iMonth,
        year: iYear,
      });
      if (newcastsOnHour.length <= 1) {
        statistics.push({ hour: i, energy: 0 });
        continue;
      }
      let sum = 0;
      for (let j = 1; j < newcastsOnHour.length; j++) {
        if (newcastsOnHour[j].energy !== 0) {
          sum += newcastsOnHour[j].energy - newcastsOnHour[j - 1].energy;
        }
      }
      sum = Number.parseFloat(sum.toFixed(2));
      statistics.push({ hour: i, energy: sum });
    }
    const averageOnday = Number.parseFloat(
      (statistics.reduce((acc, cur) => acc + cur.energy, 0) / 24).toFixed(2)
    );
    const sortStatistics = [...statistics].sort((a, b) => a.energy - b.energy);
    const maxOnDay = sortStatistics[sortStatistics.length - 1].energy;
    const minOnDay = sortStatistics[0].energy;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      statistics,
      minOnDay,
      averageOnday,
      maxOnDay,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số ");
  }
};

//Báo cáo công tơ theo tháng
const viewReportByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    const em = req.em;
    if (!month || !year) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const iMonth = Number.parseInt(month);
    const iYear = Number.parseInt(year);
    const date = new Date(iYear, iMonth - 1);
    const days = getDaysInMonth(date);
    const statistics = [];
    for (let i = 1; i <= days; i++) {
      const newcastsOnDay = await getOnDay({
        electricMeterId: em.electricMeterId,
        day: i,
        month: iMonth,
        year: iYear,
      });
      if (newcastsOnDay.length <= 1) {
        statistics.push({ day: i, energy: 0 });
        continue;
      }
      let sum = 0;
      for (let j = 1; j < newcastsOnDay.length; j++) {
        if (newcastsOnDay[j].energy !== 0) {
          sum += newcastsOnDay[j].energy - newcastsOnDay[j - 1].energy;
        }
      }
      sum = Number.parseFloat(sum.toFixed(2));
      statistics.push({ day: i, energy: sum });
    }
    const averageOnMonth = Number.parseFloat(
      (statistics.reduce((acc, cur) => acc + cur.energy, 0) / days).toFixed(2)
    );
    const sortStatistics = [...statistics].sort((a, b) => a.energy - b.energy);
    const maxOnMonth = sortStatistics[sortStatistics.length - 1].energy;
    const minOnMonth = sortStatistics[0].energy;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      statistics,
      minOnMonth,
      averageOnMonth,
      maxOnMonth,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

// Sửa tên công tơ
const renameEm = async (req, res) => {
  try {
    const em = req.em;
    const { electricMetername } = req.body;
    if (!electricMetername) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const newEm = await updateEm({
      electricMeterId: em.electricMeterId,
      electricMetername,
    });
    if (!newEm) {
      return responseFailed(
        res,
        ResponseStatus.BAD_GATEWAY,
        "Cập nhật không thành công"
      );
    }
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      electricMeter: newEm,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
  }
};

// Chuyển phòng cho thiết bị
const moveToRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const { electricMeterId, roleShare } = req.em;
    const { accountId } = req.account;
    if (!roomId) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }

    const isBelong = await checkRoomBelongAccount({ accountId, roomId });
    if (!isBelong) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Không tìm thấy phòng"
      );
    }

    const em =
      roleShare == EM_ROLES.owner
        ? await ElectricMeter.findOne({ where: { electricMeterId } })
        : await findAccountByEMShareId(electricMeterId, accountId);
    em.roomId = roomId;
    await em.save();
    return responseSuccess(res, ResponseStatus.SUCCESS, {});
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
  }
};

// Danh sách các tài khoản được chia sẻ (có thể chấp nhận hoặc chưa)
const getAccountSharedList = async (req, res) => {
  try {
    const { electricMeterId } = req.em;
    const shareAccounts = await getAccountSharedListByEMId(electricMeterId);
    return responseSuccess(res, ResponseStatus.SUCCESS, { shareAccounts });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_GATEWAY, "Có lỗi xảy ra");
  }
};

// Xóa tài khoản được chia sẻ
const deleteShareAccounts = async (req, res) => {
  try {
    const { electricMeterId } = req.em;
    const { toSharedAccountIds, notSharedAccountIds } = req.body;
    if (
      (!toSharedAccountIds || !Array.isArray(toSharedAccountIds)) &&
      (!notSharedAccountIds || !Array.isArray(notSharedAccountIds))
    ) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    if (notSharedAccountIds.length > 0) {
      await deleteInvitations({
        electricMeterId,
        accountIds: notSharedAccountIds,
      });
    }

    if (toSharedAccountIds.length > 0) {
      await deleteSharedAccounts({
        electricMeterId,
        accountIds: toSharedAccountIds,
      });
    }
    const shareAccounts = await getAccountSharedListByEMId(electricMeterId);
    return responseSuccess(res, ResponseStatus.SUCCESS, { shareAccounts });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

const getAllNewscast = async (req, res) => {
  try {
    const { electricMeterId } = req.query;
    const newscasts = await Newscast.findAll({ where: { electricMeterId } });
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      newscasts: newscasts.map((newscast) => newscast.dataValues),
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

module.exports = {
  addEM,
  shareEm,
  acceptEmShare,
  rejectEMShare,
  getEms,
  addTimer,
  viewDetailEm,
  viewReportByDay,
  viewReportByMonth,
  renameEm,
  moveToRoom,
  getAccountSharedList,
  deleteShareAccounts,
  getAllNewscast,
};
