const { Sequelize, Op } = require("sequelize");
const Account = require("../models/Account");
const Home = require("../models/Home");
const Room = require("../models/Room");
const ElectricMeter = require("../models/ElectricMeter");
const ElectricMeterShare = require("../models/ElectricMeterShare");
const Invitation = require("../models/Invitation");
const { EM_ROLES } = require("../config/constant/contants_app");

const createAccount = async ({ fullname, phoneNumber, pass, email, level }) => {
  try {
    const account = await Account.create({
      fullname,
      phoneNumber,
      pass,
      email,
      level,
    });
    return account;
  } catch (error) {
    return null;
  }
};

const findAccount = async ({ email, phoneNumber }) => {
  try {
    const account = await Account.findOne({
      where: email ? { email } : { phoneNumber },
    });
    return account;
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

    // const data = account.dataValues.homes.map((home) => {
    //   const { rooms, ...dataHome } = home.dataValues;
    //   const newRooms = rooms.map((room) => {
    //     const { electricMeters, electricMeterShares, ...dataRoom } =
    //       room.dataValues;
    //     const electricMeterShareds = electricMeterShares.map(
    //       (electricMeterShare) => {
    //         const { roleShare } = electricMeterShare.dataValues;
    //         const acceptedAt = electricMeterShare.dataValues.datetime;
    //         return {
    //           acceptedAt,
    //           role: roleShare,
    //           ...electricMeterShare.electricMeter.dataValues,
    //         };
    //       }
    //     );
    //     const lenEMs1 = electricMeters.length;
    //     const lenEMs2 = electricMeterShareds.length;
    //     let i = 0;
    //     let j = 0;
    //     const ems = [];
    //     while (i < lenEMs1 || j < lenEMs2) {
    //       if (i < lenEMs1 && j < lenEMs2) {
    //         const { acceptedAt, ...shareEm } = electricMeterShareds[j];
    //         if (electricMeters[i].createdAt < acceptedAt) {
    //           ems.push({
    //             ...electricMeters[i].dataValues,
    //             role: EM_ROLES.owner,
    //           });
    //           i++;
    //         } else {
    //           ems.push(shareEm);
    //           j++;
    //         }
    //       } else if (i < lenEMs1) {
    //         ems.push({ ...electricMeters[i].dataValues, role: EM_ROLES.owner });
    //         i++;
    //       } else {
    //         const { acceptedAt, ...shareEm } = electricMeterShareds[j];
    //         ems.push(shareEm);
    //         j++;
    //       }
    //     }
    //     return { ...dataRoom, electricMeters: ems };
    //   });
    //   return { ...dataHome, rooms: newRooms };
    // });

    // return { ...account.dataValues, homes: data };
    return account.dataValues;
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
        "roleShare",
        [Sequelize.col("electricMeter.electricMeterId"), "electricMeterId"],
        [Sequelize.col("account.accountId"), "accountId"],
        [Sequelize.col("electricMeter.electricMetername"), "electricMetername"],
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

const getAllInfor = async ({ email, phoneNumber }) => {
  try {
    const account = await Account.findOne({
      where: email ? { email } : { phoneNumber },
      attributes: { exclude: ["createdAt", "updatedAt"] },
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

module.exports = {
  createAccount,
  joinAccount,
  findAccount,
  getListInvitationByAccountId,
  getAllInfor,
};
