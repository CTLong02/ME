const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResposeStatus = require("../config/constant/response_status");
const {
  findAccountByEmailService,
  findAccountByPhoneNumberService,
} = require("../services/Account.service");
const exitsAccountMiddleware = async (req, res, next) => {
  const { email, phonenumber } = req.body;
  if (!email && !phonenumber) {
    return responseFailed(res, ResposeStatus.BAD_REQUEST, "Thiếu tham số");
  }

  const accountByEmail = await findAccountByEmailService(email);
  const accountByPhone = await findAccountByPhoneNumberService(phonenumber);
  if (!accountByEmail && !accountByPhone) {
    return responseFailed(
      res,
      ResposeStatus.NOT_FOUND,
      `Tài khoản với ${!!email ? "email" : "số điện thoại"} không tồn tại`
    );
  }

  if (
    !!accountByEmail &&
    !!accountByPhone &&
    accountByEmail !== accountByPhone
  ) {
    return responseFailed(
      res,
      ResposeStatus.NOT_FOUND,
      `Email và số điện thoại không trùng khớp`
    );
  }

  req.recipientAccount = !!accountByEmail ? accountByEmail : accountByPhone;
  next();
};

module.exports = { exitsAccountMiddleware };
