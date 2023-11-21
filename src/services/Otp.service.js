const Otp = require("../models/Otp");

const createOtp = async ({ phoneNumber, hashedOtp }) => {
  try {
    const opt = await Otp.create({
      phoneNumber,
      hashedOtp,
      datetime: new Date(),
    });
    return opt ? opt.dataValues : null;
  } catch (error) {
    return null;
  }
};

const findOtp = async (phoneNumber) => {
  try {
    const opt = await Otp.findOne({ where: { phoneNumber } });
    return opt ? opt.dataValues : null;
  } catch (error) {
    return null;
  }
};

const deleteOtp = async (phoneNumber) => {
  try {
    const num = await Otp.destroy({ where: { phoneNumber } });
    return num;
  } catch (error) {
    return null;
  }
};

const deleteOtpById = async (otpId) => {
  try {
    const num = await Otp.destroy({ where: { otpId } });
    return num;
  } catch (error) {
    return null;
  }
};

module.exports = { createOtp, findOtp, deleteOtp, deleteOtpById };
