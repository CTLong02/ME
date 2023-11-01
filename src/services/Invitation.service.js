const { Sequelize, Op } = require("sequelize");
const Invitation = require("../models/Invitation");
const Account = require("../models/Account");
const ElectricMeter = require("../models/ElectricMeter");
const createInvitation = async ({
  electricMeterId,
  accountId,
  roleShare,
  roomname,
  homename,
}) => {
  try {
    const invitation = await Invitation.create({
      electricMeterId,
      accountId,
      roleShare,
      roomname,
      homename,
    });
    return invitation;
  } catch (error) {
    return null;
  }
};

const findInvitationByEMIdAndAccoutId = async ({
  electricMeterId,
  accountId,
}) => {
  try {
    const invitation = await Invitation.findOne({
      where: { electricMeterId, accountId },
    });
    return invitation;
  } catch (error) {
    return null;
  }
};

const findInvitationsByEMId = async (electricMeterId) => {
  try {
    const invitations = await Invitation.findAll({
      where: { electricMeterId },
    });
    return invitations;
  } catch (error) {
    return [];
  }
};

const findInvitationsByAccountId = async (accountId) => {
  try {
    const invitations = await Invitation.findAll({
      where: { accountId },
    });
    return invitations;
  } catch (error) {
    return [];
  }
};

const deleteInvitation = async ({ electricMeterId, accountId }) => {
  try {
    const num = await Invitation.destroy({
      where: { electricMeterId, accountId },
      force: true,
    });
    return num;
  } catch (error) {
    return null;
  }
};

const getListInvitationByEMId = async (electricMeterId) => {
  try {
    const invitations = await Invitation.findAll({
      where: { electricMeterId },
      order: [["datetime", "ASC"]],
      attributes: [
        "datetime",
        "roleShare",
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
    return !!invitations
      ? invitations.map((invitation) => {
          const { account, electricMeter, ...data } = invitation.dataValues;
          return data;
        })
      : [];
  } catch (error) {
    return [];
  }
};

const deleteInvitations = async ({ electricMeterId, accountIds }) => {
  try {
    const num = await Invitation.destroy({
      where: {
        electricMeterId,
        accountId: {
          [Op.or]: [
            ...accountIds.map((id) => {
              return { [Op.eq]: id };
            }),
          ],
        },
      },
    });
    return num;
  } catch (error) {
    return null;
  }
};

module.exports = {
  createInvitation,
  findInvitationByEMIdAndAccoutId,
  findInvitationsByEMId,
  findInvitationsByAccountId,
  deleteInvitation,
  getListInvitationByEMId,
  deleteInvitations,
};
