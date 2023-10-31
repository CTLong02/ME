const Invitation = require("../models/Invitation");
const createInvitation = async ({
  electricMeterId,
  accountId,
  role,
  roomname,
  homename,
}) => {
  try {
    const invitation = await Invitation.create({
      electricMeterId,
      accountId,
      role,
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

module.exports = {
  createInvitation,
  findInvitationByEMIdAndAccoutId,
  findInvitationsByEMId,
  findInvitationsByAccountId,
  deleteInvitation,
};
