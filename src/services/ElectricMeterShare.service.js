const ElectricMeterShare = require("../models/ElectricMeterShare");
const { createRoom } = require("../services/Room.service");
const { createHome } = require("../services/Home.service");
// const {} = require("../services/ElectricMeter.service")
const createEMShareForAnAccount = async ({
  accountId,
  electricMeterId,
  roomname,
  homename,
}) => {
  try {
    const home = await createHome({ name: homename, accountId });
    const room = await createRoom({ name: roomname, homeId: home.homeId });
    const emShare = await ElectricMeterShare.create({
      accountId,
      electricMeterId,
      roomId: room.roomId,
    });
    return !!emShare ? emShare : null;
  } catch (error) {
    return null;
  }
};

module.exports = { createEMShareForAnAccount };
