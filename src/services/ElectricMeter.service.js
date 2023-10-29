const { createHome } = require("./Home.service");
const { createRoom } = require("./Room.service");
const { ROLE_EM } = require("../config/constant/constant_model");
const ElectricMeter = require("../models/ElectricMeter");
const ElectricMeterShare = require("../models/ElectricMeterShare");
const Room = require("../models/Room");
const Home = require("../models/Home");
const Account = require("../models/Account");
const { Sequelize } = require("sequelize");
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

const findEMsByAcountId = async ({ roomId, homeId, accountId }) => {
  try {
    const ownEMs = await ElectricMeter.findAll({
      order: [["createdAt", "ASC"]],
      attributes: [
        "electricMeterId",
        "name",
        [Sequelize.literal("'owner'"), "role"],
        [Sequelize.col("room.roomId"), "roomId"],
        [Sequelize.col("room.name"), "roomname"],
        [Sequelize.col("room.home.homeId"), "homeId"],
        [Sequelize.col("room.home.name"), "homename"],
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

module.exports = { addEM, findEMById, findAccountByEMId, findEMsByAcountId };
