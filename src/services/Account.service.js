const { Sequelize } = require("sequelize");
const Account = require("../models/Account");
const Home = require("../models/Home");
const Room = require("../models/Room");
const ElectricMeter = require("../models/ElectricMeter");
const ElectricMeterShare = require("../models/ElectricMeterShare");
const Invitation = require("../models/Invitation");
const { hashPw, comparePw } = require("../utils/helper/AccountHelper");
const { EM_ROLES } = require("../config/constant/contants_app");
const createAccountByEmailService = async (email, pass) => {
  try {
    const passHash = hashPw(pass);
    const account = await Account.create({ email, pass: passHash });
    delete account.dataValues.pass;
    return account.dataValues;
  } catch (error) {
    return null;
  }
};
const createAccountByPhoneNumberService = async (phoneNumber) => {
  try {
    const account = await Account.create({ phoneNumber });
    delete account.dataValues.pass;
    return account;
  } catch (error) {
    return null;
  }
};

const findAccountByEmailService = async (email) => {
  try {
    const account = await Account.findOne({
      where: { email },
      attributes: { exclude: ["pass"] },
    });
    if (account) {
      return account.dataValues;
    }
    return null;
  } catch (error) {
    return null;
  }
};
const findAccountByPhoneNumberService = async (phoneNumber) => {
  try {
    const account = await Account.findOne({
      where: { phoneNumber },
      attributes: { exclude: ["pass"] },
    });
    if (account) {
      delete account.dataValues.pass;
      return account.dataValues;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const findAccountByEmailAndPass = async (email, pass) => {
  try {
    const account = await Account.findOne({
      where: { email },
    });
    const comparePass = comparePw(pass, account.pass);
    if (!!account && comparePass) {
      return account.dataValues;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const joinAccount = async (accountId) => {
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
                  required: false,
                  attributes: { exclude: ["createdAt", "updatedAt"] },
                },
                {
                  model: ElectricMeterShare,
                  as: "electricMeterShares",
                  order: [["datetime", "ASC"]],
                  required: false,
                  include: {
                    model: ElectricMeter,
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    as: "electricMeter",
                    required: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const data = account.dataValues.homes.map((home) => {
      const { rooms, ...dataHome } = home.dataValues;
      const newRooms = rooms.map((room) => {
        const { electricMeters, electricMeterShares, ...dataRoom } =
          room.dataValues;
        const electricMeterShareds = electricMeterShares.map(
          (electricMeterShare) => {
            const { roleShare } = electricMeterShare.dataValues;
            const acceptedAt = electricMeterShare.dataValues.datetime;
            return {
              acceptedAt,
              role: roleShare,
              ...electricMeterShare.electricMeter.dataValues,
            };
          }
        );
        const lenEMs1 = electricMeters.length;
        const lenEMs2 = electricMeterShareds.length;
        let i = 0;
        let j = 0;
        const ems = [];
        while (i < lenEMs1 || j < lenEMs2) {
          if (i < lenEMs1 && j < lenEMs2) {
            const { acceptedAt, ...shareEm } = electricMeterShareds[j];
            if (electricMeters[i].createdAt < acceptedAt) {
              ems.push({
                ...electricMeters[i].dataValues,
                role: EM_ROLES.owner,
              });
              i++;
            } else {
              ems.push(shareEm);
              j++;
            }
          } else if (i < lenEMs1) {
            ems.push({ ...electricMeters[i].dataValues, role: EM_ROLES.owner });
            i++;
          } else {
            const { acceptedAt, ...shareEm } = electricMeterShareds[j];
            ems.push(shareEm);
            j++;
          }
        }
        return { ...dataRoom, electricMeters: ems };
      });
      return { ...dataHome, rooms: newRooms };
    });

    return { ...account.dataValues, homes: data };
  } catch (error) {
    return null;
  }
};

const getListInvitationByAccountId = async (accountId) => {
  try {
    const invitations = await Invitation.findAll({
      where: { accountId },
      attributes: [
        "invitationId",
        "datetime",
        [Sequelize.col("role"), "roleShare"],
        [Sequelize.col("electricMeter.electricMeterId"), "electricMeterId"],
        [Sequelize.col("account.accountId"), "accountId"],
        [Sequelize.col("electricMeter.name"), "electricMeterName"],
        [Sequelize.col("account.fullname"), "fullname"],
        [Sequelize.col("account.email"), "email"],
        [Sequelize.col("account.phonenumber"), "phonenumber"],
      ],
      include: [
        { model: Account, as: "account", required: true },
        { model: ElectricMeter, as: "electricMeter", required: true },
      ],
    });
    return invitations;
  } catch (error) {
    return [];
  }
};

module.exports = {
  createAccountByEmailService,
  createAccountByPhoneNumberService,
  findAccountByEmailService,
  findAccountByPhoneNumberService,
  findAccountByEmailAndPass,
  joinAccount,
  getListInvitationByAccountId,
};
