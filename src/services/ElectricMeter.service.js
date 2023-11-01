const { createHome } = require("./Home.service");
const { createRoom } = require("./Room.service");
const ElectricMeter = require("../models/ElectricMeter");
const Room = require("../models/Room");
const Home = require("../models/Home");
const Account = require("../models/Account");
const { Sequelize } = require("sequelize");
const { findShareAccountsByEMId } = require("./ElectricMeterShare.service");
const { getListInvitationByEMId } = require("./Invitation.service");
const addEM = async ({
  ID,
  Ver,
  Net,
  SimImei,
  Conn,
  Signal,
  Strength,
  Ssid,
  Pass,
  Rtc,
}) => {
  try {
    const electricMeter = await ElectricMeter.create({
      electricMeterId: ID,
      ver: Ver,
      net: Net,
      simImei: SimImei,
      conn: Conn,
      signal: Signal,
      strength: Strength,
      ssid: Ssid,
      pass: Pass,
      rtc: Rtc,
    });
    return electricMeter.dataValues;
  } catch (error) {
    return null;
  }
};

const findEMById = async (electricMeterId) => {
  try {
    const electricMeter = await ElectricMeter.findOne({
      attributes: { exclude: ["createdAt", "updatedAt"] },
      where: { electricMeterId },
    });
    return !!electricMeter ? electricMeter.dataValues : null;
  } catch (error) {
    return null;
  }
};

const findAccountByEMId = async (electricMeterId) => {
  try {
    const account = await ElectricMeter.findOne({
      where: { electricMeterId },
      attributes: [
        "electricMeterId",
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

const findEMsByAcountId = async ({ roomId, homeId, accountId }) => {
  try {
    const ownEMs = await ElectricMeter.findAll({
      order: [["createdAt", "ASC"]],
      attributes: [
        "electricMeterId",
        "electricMetername",
        [Sequelize.literal("'owner'"), "role"],
        [Sequelize.col("room.roomId"), "roomId"],
        [Sequelize.col("room.roomname"), "roomname"],
        [Sequelize.col("room.home.homeId"), "homeId"],
        [Sequelize.col("room.home.homename"), "homename"],
      ],
      include: {
        model: Room,
        as: "room",
        required: true,
        where: roomId ? { roomId } : {},
        include: {
          model: Home,
          as: "home",
          required: true,
          where: homeId ? { homeId } : {},
          include: {
            as: "account",
            model: Account,
            where: { accountId },
            required: true,
          },
        },
      },
    });
    return ownEMs
      ? ownEMs.map((ownEM) => {
          return { ...ownEM.dataValues };
        })
      : [];
  } catch (error) {
    return [];
  }
};

const updateEm = async ({
  electricMeterId,
  ver,
  net,
  simImei,
  conn,
  signal,
  strength,
  ssid,
  pass,
  rtc,
  electricMetername,
  macAddress,
}) => {
  try {
    const em = await ElectricMeter.findOne({ where: { electricMeterId } });
    em.ver = ver ? ver : em.ver;
    em.net = net ? net : em.net;
    em.simImei = simImei ? simImei : em.simImei;
    em.conn = conn ? conn : em.conn;
    em.signal = signal ? signal : em.signal;
    em.strength = strength ? strength : em.strength;
    em.ssid = ssid ? ssid : em.ssid;
    em.pass = pass ? pass : em.pass;
    em.rtc = rtc ? rtc : em.rtc;
    em.electricMetername = electricMetername
      ? electricMetername
      : em.electricMetername;
    em.macAddress = macAddress ? macAddress : em.macAddress;
    await em.save();
    return em.dataValues;
  } catch (error) {
    return null;
  }
};

const getAccountSharedListByEMId = async (electricMeterId) => {
  try {
    const sharedAccount = await findShareAccountsByEMId(electricMeterId);
    const invitations = await getListInvitationByEMId(electricMeterId);
    const shareAccounts = [];
    const lenSharedAccounts = sharedAccount.length;
    const lenInvitations = invitations.length;
    let i = 0;
    let j = 0;
    while (i < lenSharedAccounts || j < lenInvitations) {
      if (i < lenSharedAccounts && j < lenInvitations) {
        const { createdAt, ...sharedData } = sharedAccount[i];
        const { datetime, electricMeterName, ...invitationData } =
          invitations[j];
        if (createdAt < datetime) {
          const { roleShare } = sharedAccount[i];
          shareAccounts.push({
            ...sharedData,
            roleShare,
            accepted: true,
            datetime: createdAt,
          });
          i++;
        } else {
          const { roleShare } = invitations[j];
          shareAccounts.push({
            ...invitationData,
            roleShare,
            accepted: false,
            datetime,
          });
          j++;
        }
      } else if (i < lenSharedAccounts) {
        const { createdAt, roleShare, ...sharedData } = sharedAccount[i];
        shareAccounts.push({
          ...sharedData,
          roleShare,
          accepted: true,
          datetime: createdAt,
        });
        i++;
      } else {
        const { datetime, roleShare, electricMeterName, ...invitationData } =
          invitations[j];
        shareAccounts.push({
          ...invitationData,
          roleShare,
          accepted: false,
          datetime,
        });
        j++;
      }
    }
    return shareAccounts;
  } catch (error) {
    return [];
  }
};

module.exports = {
  addEM,
  findEMById,
  findAccountByEMId,
  findEMsByAcountId,
  updateEm,
  getAccountSharedListByEMId,
};
