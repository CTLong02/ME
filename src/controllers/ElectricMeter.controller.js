const {
  differenceInMilliseconds,
  getDaysInMonth,
  setHours,
  startOfMonth,
  startOfDay,
  setDate,
  endOfDay,
  differenceInDays,
} = require("date-fns");

const Account = require("../models/Account");
const Home = require("../models/Home");
const Room = require("../models/Room");
const ElectricMeter = require("../models/ElectricMeter");
const Energy = require("../models/Energy");

const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const { toFloat2 } = require("../utils/helper/AppHelper");

const TIME = require("../config/constant/constant_time");
const ResponseStatus = require("../config/constant/response_status");
const { ROLE_EM } = require("../config/constant/constant_model");
const { EM_ROLES } = require("../config/constant/contants_app");
const { REQUEST_COMAND } = require("../config/constant/command");

const {
  createRoom,
  checkRoomBelongAccount,
} = require("../services/Room.service");
const {
  findEnergy,
  findEnergysByday,
  getAllEnergyOnMonth,
} = require("../services/Energy.service");
const {
  getEnergyChangesOnDay,
  getEnergyChangesOnMonth,
} = require("../services/EnergyChange.service");
const { createHome } = require("../services/Home.service");
const { publish } = require("../services/mqtt.service");
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
const { getAllInfor } = require("../services/Account.service");

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
          include: [
            {
              model: Room,
              as: "rooms",
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
        findedEM.acceptedAt = new Date();
        findedEM.electricMetername = !!electricMetername
          ? electricMetername
          : findedEM.electricMetername;
        await findedEM.save();
        const newAccount = await getAllInfor({
          accountId: req.account.accountId,
        });
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
      findedEM.acceptedAt = new Date();
      findedEM.electricMetername = !!electricMetername
        ? electricMetername
        : findedEM.electricMetername;
      await findedEM.save();
      const newAccount = await getAllInfor({
        accountId: req.account.accountId,
      });
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
    findedEM.acceptedAt = new Date();
    findedEM.electricMetername = !!electricMetername
      ? electricMetername
      : findedEM.electricMetername;
    await findedEM.save();
    const newAccount = await getAllInfor({
      accountId: req.account.accountId,
    });
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
        if (ownEMs[i].acceptedAt < acceptedAt) {
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
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      electricMeter: emInfor,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_GATEWAY, "Lỗi server");
  }
};

// Báo cáo công tơ theo ngày
const viewReportByDay = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số ");
    }
    const { electricMeterId } = req.em;
    const datetime = new Date(date);
    const energys = await findEnergysByday({ electricMeterId, date: datetime });
    const energyChanges = await getEnergyChangesOnDay({
      electricMeterId,
      datetime,
    });
    const energysByDay = [];

    for (let i = 0; i < energys.length; i++) {
      const energy = energys[i];
      const { firstValue, lastValue, hour, createdAt, updatedAt } =
        energy.dataValues;
      const sumIncreasement = energyChanges.reduce((acc, energyChange) => {
        const { preValue, curValue, datetime } = energyChange;
        return datetime >= createdAt && datetime <= updatedAt
          ? acc + curValue - preValue
          : acc;
      }, 0);
      const value =
        lastValue - firstValue - sumIncreasement > 0
          ? lastValue - firstValue - sumIncreasement
          : 0;
      const energyByHour = Number.parseFloat(value.toFixed(2));
      energysByDay.push({ energyByHour, hour });
    }
    let maxByDay = energysByDay.length > 0 ? energysByDay[0].energyByHour : 0;
    let minByDay = energysByDay.length > 0 ? energysByDay[0].energyByHour : 0;
    let sum = 0;
    energysByDay.forEach((energyByDay) => {
      const energy = energyByDay.energyByHour;
      sum += energy;
      maxByDay = maxByDay > energy ? maxByDay : energy;
      minByDay = minByDay > energy ? energy : minByDay;
    });
    maxByDay = toFloat2(maxByDay);
    minByDay = toFloat2(minByDay);
    const averageByDay =
      energysByDay.length > 0
        ? Number.parseFloat((sum / energysByDay.length).toFixed(2))
        : 0;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      energysByDay,
      minByDay,
      maxByDay,
      averageByDay,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số ");
  }
};

//Báo cáo công tơ theo tháng
const viewReportByMonth = async (req, res) => {
  try {
    const { date } = req.query;
    const { electricMeterId } = req.em;
    if (!date) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const datetime = new Date(date);
    const daysInMonth = getDaysInMonth(datetime);
    const energysByMonth = await getAllEnergyOnMonth({
      electricMeterId,
      date: datetime,
    });
    const energyChanges = await getEnergyChangesOnMonth({
      electricMeterId,
      datetime,
    });
    for (let i = 1; i <= daysInMonth; i++) {
      const dateOfMonth = setDate(datetime, i);
      const dateStartOfDay = startOfDay(dateOfMonth);
      const dateEndOfDay = endOfDay(dateOfMonth);
      const energysOnDay = energysByMonth.filter(
        (energyByMonth) =>
          differenceInDays(new Date(energyByMonth.date), dateOfMonth) === 0
      );
      const sumIncreasement = energyChanges.reduce((acc, energyChange) => {
        const { preValue, curValue, datetime } = energyChange;
        return datetime >= date && datetime <= updatedAt
          ? acc + curValue - preValue
          : acc;
      }, 0);
    }
    return responseSuccess(res, ResponseStatus.SUCCESS, { energysByMonth });
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
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

// Thay đổi chỉ số  công tơ
const changeEnergyValue = async (req, res) => {
  try {
    const { value } = req.body;
    const { electricMeterId } = req.em;
    if (!value) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const fValue = Number.parseFloat(value.toString());
    await publish({
      electricMeterId,
      command: REQUEST_COMAND.CHANGE_EM,
      data: { value: fValue },
    });
    return responseSuccess(res, ResponseStatus.SUCCESS, {});
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

const createData = async (req, res) => {
  try {
    const electricMeterId = "SMR-64B708A0E22C";
    let sum = 0;
    for (let i = 1; i <= 1440 * 30; i++) {
      const random = Number.parseFloat(Math.random().toFixed(2));
      sum = Number.parseFloat((sum + random).toFixed(2));
      const datetime = new Date(2022, 4, 1, 0, i);
      const hour = datetime.getHours();
      const energy = await findEnergy({
        electricMeterId,
        hour,
        date: datetime,
      });
      if (energy) {
        energy.lastValue = sum;
        await energy.save();
      } else {
        const newDate = setHours(datetime, hour - 1);
        const preEnergy = await findEnergy({
          electricMeterId,
          hour: newDate.getHours(),
          date: newDate,
        });
        if (preEnergy) {
          await Energy.create({
            electricMeterId,
            firstValue: preEnergy.lastValue,
            lastValue: sum,
            hour,
            date: datetime,
          });
        } else {
          await Energy.create({
            electricMeterId,
            firstValue: sum,
            lastValue: sum,
            hour,
            date: datetime,
          });
        }
      }
      console.log();
    }
    return responseSuccess(res, ResponseStatus.SUCCESS, {});
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
  changeEnergyValue,
  createData,
};
