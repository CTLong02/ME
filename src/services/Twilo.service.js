const accountSid = "ACc559b3f8ba460ee6bfe922056ddde4d9";
const authToken = "1b2ef7d045737a7ab45e5e3be0e00790";

const client = require("twilio")(accountSid, authToken);
const moment = require("moment");

const handle = (number, length) => {
  return `${"0".repeat(length - number.toString().length)}${number}`;
};

const sendOTP = async (phoneNumber) => {
  try {
    const OTP = Math.floor(Math.random() * 10000);
    const sOtp = handle(OTP, 4);
    const message = await client.messages.create({
      body: `Mã OTP của bạn là ${handle(
        OTP,
        4
      )}.Đừng để cho người khác biết mã OTP này`,
      to: `+84${phoneNumber.slice(1)}`, // Text your number
      from: "+16505177437", // From a valid Twilio number
    });
    console.log(message);
    return sOtp;
  } catch (error) {
    console.log(
      moment().format(),
      "twilo.service.js:36",
      "error",
      error.message
    );
    return null;
  }
};

module.exports = { sendOTP };
