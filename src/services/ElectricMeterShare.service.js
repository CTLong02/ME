const ElectricMeterShare = require("../models/ElectricMeterShare");
const ElectricMeter = require("../models/ElectricMeter");
const Room = require("../models/Room");
const Home = require("../models/Home");
const Account = require("../models/Account");
const { Sequelize, Op } = require("sequelize");
const { createRoom } = require("../services/Room.service");
const { createHome } = require("../services/Home.service");
const { ROLE_EM } = require("../config/constant/constant_model");
const createEMShareForAnAccount = async ({
  accountId,
  electricMeterId,
  roomname,
  homename,
  roleShare,
}) => {
  try {
    const home = await createHome({ homename, accountId });
    const room = await createRoom({ roomname, homeId: home.homeId });
    const emShare = await ElectricMeterShare.create({
      accountId,
      electricMeterId,
      roomId: room.roomId,
      roleShare,
    });
    return !!emShare ? emShare : null;
  } catch (error) {
    return null;
  }
};

const findAccountByEMShareId = async (electricMeterId, accountId) => {
  try {
    const emShare = await ElectricMeterShare.findOne({
      where: { electricMeterId },
      attributes: [
        "electricMeterShareId",
        "roleShare",
        [Sequelize.col("room.home.account.accountId"), "accountId"],
        [Sequelize.col("room.roomname"), "roomname"],
        [Sequelize.col("room.home.homename"), "homename"],
      ],
      include: [
        {
          model: Room,
          as: "room",
          right: true,
          required: true,
          include: [
            {
              model: Home,
              as: "home",
              required: true,
              include: [
                {
                  model: Account,
                  as: "account",
                  where: { accountId },
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });
    return !!emShare ? emShare : null;
  } catch (error) {
    return null;
  }
};

const findShareAccountsByEMId = async (electricMeterId) => {
  try {
    const accounts = await ElectricMeterShare.findAll({
      where: { electricMeterId },
      order: [["createdAt", "ASC"]],
      attributes: [
        "roleShare",
        "createdAt",
        [Sequelize.col("room.home.account.accountId"), "accountId"],
        [Sequelize.col("room.home.account.email"), "email"],
        [Sequelize.col("room.home.account.fullname"), "fullname"],
        [Sequelize.col("room.home.account.phonenumber"), "phonenumber"],
      ],
      include: [
        {
          model: Room,
          as: "room",
          required: true,
          include: [
            {
              model: Home,
              as: "home",
              required: true,
              include: [{ model: Account, as: "account", required: true }],
            },
          ],
        },
      ],
    });

    return !!accounts
      ? accounts.map((account) => {
          const { room, ...shareAccount } = account.dataValues;
          return shareAccount;
        })
      : [];
  } catch (error) {
    return [];
  }
};

const findShareAccountByEMId = async (electricMeterId, accountId) => {
  try {
    const account = await ElectricMeterShare.findAll({
      where: { electricMeterId },
      attributes: [
        "electricMeterShareId",
        "accepted",
        "roomId",
        "roleShare",
        [Sequelize.col("room.home.account.accountId"), "accountId"],
        [Sequelize.col("room.home.account.email"), "email"],
        [Sequelize.col("room.home.account.phonenumber"), "phonenumber"],
      ],
      include: [
        {
          model: Room,
          as: "room",
          required: true,
          include: [
            {
              model: Home,
              as: "home",
              required: true,
              include: [
                {
                  model: Account,
                  as: "account",
                  where: { accountId },
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });
    const newAccount = account ? account[0] : null;
    if (newAccount) {
      const { room, ...shareAccount } = newAccount.dataValues;
      return shareAccount;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const deleteEMShare = async ({ electricMeterId, accountId }) => {
  try {
    const emShare = await findShareAccountByEMId(electricMeterId, accountId);
    if (!!emShare) {
      await ElectricMeterShare.destroy({
        where: { electricMeterShareId: emShare.electricMeterShareId },
      });
      return emShare;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const updateEMShare = async ({
  electricMeterId,
  accountId,
  roleShare,
  accepted,
  roomId,
}) => {
  try {
    const emShares = await ElectricMeterShare.findAll({
      where: { electricMeterId },
      attributes: ["accepted", "roleShare", "electricMeterShareId"],
      include: [
        {
          model: Room,
          as: "room",
          required: true,
          include: [
            {
              model: Home,
              as: "home",
              required: true,
              include: [
                {
                  model: Account,
                  as: "account",
                  where: { accountId },
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });
    if (!emShares) {
      return null;
    }
    const emShare = emShares[0];
    if (emShare) {
      emShare.roleShare =
        !!roleShare && Object.values(ROLE_EM).includes(roleShare)
          ? roleShare
          : emShare.roleShare;
      emShare.accepted =
        !!accepted && (accepted === 0 || accepted === 1)
          ? accepted
          : emShare.accepted;
      emShare.acceptedAt =
        accepted === 1 ? new Date(Date.now()) : emShare.acceptedAt;
      emShare.roomId = roomId ? roomId : emShare.roomId;
      await emShare.save();
      return emShare;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const findSharedEmsByAccountId = async ({ roomId, homeId, accountId }) => {
  try {
    const sharedEms = await ElectricMeterShare.findAll({
      order: [["createdAt", "ASC"]],
      attributes: [
        "electricMeterId",
        ["roleShare", "role"],
        [Sequelize.col("electricMeter.createdAt"), "acceptedAt"],
        [Sequelize.col("electricMeter.electricMetername"), "electricMetername"],
        [Sequelize.col("room.roomId"), "roomId"],
        [Sequelize.col("room.roomname"), "roomname"],
        [Sequelize.col("room.home.homeId"), "homeId"],
        [Sequelize.col("room.home.homename"), "homename"],
      ],
      include: [
        {
          model: ElectricMeter,
          as: "electricMeter",
          required: true,
          attributes: { exclude: ["updatedAt", "roomId"] },
        },
        {
          model: Room,
          as: "room",
          required: true,
          where: roomId ? { roomId } : {},
          include: {
            model: Home,
            as: "home",
            where: homeId ? { homeId } : {},
            required: true,
            include: {
              model: Account,
              as: "account",
              where: { accountId },
              required: true,
            },
          },
        },
      ],
    });
    const ems = sharedEms.map((sharedEm) => {
      const { electricMeter, ...value } = sharedEm.dataValues;
      return value;
    });
    return ems ? ems : [];
  } catch (error) {
    return [];
  }
};

const deleteSharedAccounts = async ({ electricMeterId, accountIds }) => {
  try {
    let num = 0;
    accountIds.forEach(async (accountId) => {
      await deleteEMShare({ electricMeterId, accountId });
      num++;
    });
    return num;
  } catch (error) {
    return null;
  }
};

module.exports = {
  createEMShareForAnAccount,
  findAccountByEMShareId,
  findShareAccountsByEMId,
  findShareAccountByEMId,
  deleteEMShare,
  updateEMShare,
  findSharedEmsByAccountId,
  deleteSharedAccounts,
};
