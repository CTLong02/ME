const ElectricMeterShare = require("../models/ElectricMeterShare");
const ElectricMeter = require("../models/ElectricMeter");
const Room = require("../models/Room");
const Home = require("../models/Home");
const Account = require("../models/Account");
const { Sequelize } = require("sequelize");
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
    const home = await createHome({ name: homename, accountId });
    const room = await createRoom({ name: roomname, homeId: home.homeId });
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
    const account = await ElectricMeterShare.findOne({
      where: { electricMeterId, accountId },
      attributes: [
        "electricMeterShareId",
        "roleShare",
        [(Sequelize.col("room.home.account.accountId"), "accountId")],
        [Sequelize.col("room.name"), "roomname"],
        [Sequelize.col("room.home.name"), "homename"],
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
              include: [{ model: Account, as: "account" }],
            },
          ],
        },
      ],
    });
    return !!account ? account.dataValues : null;
  } catch (error) {
    return null;
  }
};

const findShareAccountsByEMId = async (electricMeterId) => {
  try {
    const accounts = await ElectricMeterShare.findAll({
      where: { electricMeterId },
      attributes: [
        [Sequelize.col("room.home.account.accountId"), "accountId"],
        [Sequelize.col("room.home.account.email"), "email"],
        [Sequelize.col("room.home.account.phonenumber"), "phonenumber"],
      ],
      include: [
        {
          model: Room,
          as: "room",
          include: [
            {
              model: Home,
              as: "home",
              include: [{ model: Account, as: "account" }],
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
      : null;
  } catch (error) {
    return null;
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

const deleteEMShare = async (electricMeterId, accountId) => {
  try {
    const emShare = await findShareAccountByEMId(electricMeterId, accountId);
    if (!!emShare) {
      await ElectricMeterShare.destroy({
        where: { electricMeterId },
        include: [
          {
            model: Room,
            as: "room",
            include: [
              {
                model: Home,
                as: "home",
                include: [
                  { model: Account, as: "account", where: { accountId } },
                ],
              },
            ],
          },
        ],
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
      await emShare.save();
      return emShare;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const findSharedEmsByAccountId = async (accountId) => {
  try {
    const sharedEms = await ElectricMeterShare.findAll({
      include: {
        model: ElectricMeter,
        as: "electricMeter",
        required: true,
        include: {
          model: Room,
          as: "room",
          required: true,
          include: {
            model: Home,
            as: "home",
            required: true,
            include: {
              model: Account,
              where: { accountId },
              as: "account",
              required: true,
            },
          },
        },
      },
    });
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
};
