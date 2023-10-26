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

const findEMsByAcountId = async (accountId) => {
  try {
    const account = await Account.findOne({
      where: { accountId },
      attributes: { exclude: ["createdAt", "updatedAt", "pass"] },
      include: [
        {
          model: Home,
          attributes: { exclude: ["createdAt", "updatedAt", "accountId"] },
          as: "homes",
          order: [["createdAt", "ASC"]],
          include: [
            {
              model: Room,
              attributes: { exclude: ["createdAt", "updatedAt", "homeId"] },
              order: [["createdAt", "ASC"]],
              as: "rooms",
              required: true,
              include: [
                {
                  model: ElectricMeter,
                  as: "electricMeters",
                  order: [["createdAt", "ASC"]],
                  required: false,
                  attributes: { exclude: ["createdAt", "updatedAt", "roomId"] },
                },
                {
                  model: ElectricMeterShare,
                  where: {
                    accepted: 1,
                  },
                  required: false,
                  as: "electricMeterShares",
                  order: [["createdAt", "ASC"]],
                  attributes: { exclude: ["createdAt", "updatedAt", "roomId"] },
                  include: [
                    {
                      model: ElectricMeter,
                      as: "electricMeter",
                      attributes: {
                        exclude: ["createdAt", "updatedAt", "roomId"],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    // const electricMeters
  } catch (error) {
    return null;
  }
};
module.exports = { addEM, findEMById, findAccountByEMId, findEMsByAcountId };
