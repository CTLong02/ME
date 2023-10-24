const ElectricMeterShare = require("../models/ElectricMeterShare");
const { createRoom } = require("../services/Room.service");
const { createHome } = require("../services/Home.service");
const Room = require("../models/Room");
const Home = require("../models/Home");
const Account = require("../models/Account");
const { Sequelize } = require("sequelize");
// const {} = require("../services/ElectricMeter.service")
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
    const account = await ElectricMeterShare.findOne({
      where: { electricMeterId },
      attributes: [
        "electricMeterShareId",
        "accepted",
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
              include: [
                { model: Account, as: "account", where: { accountId } },
              ],
            },
          ],
        },
      ],
    });
    const { room, ...shareAccount } = account.dataValues;
    return !!account ? shareAccount : null;
  } catch (error) {
    return null;
  }
};

const deleteEMShare = async (electricMeterId, accountId) => {
  try {
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
  } catch (error) {}
};

module.exports = {
  createEMShareForAnAccount,
  findAccountByEMShareId,
  findShareAccountsByEMId,
  findShareAccountByEMId,
  deleteEMShare,
};
