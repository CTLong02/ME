const { responseFailed } = require("../utils/helper/RESTHelper");
const ResposeStatus = require("../config/constant/response_status");
const { findAccount } = require("../services/Account.service");
const exitsAccountMiddleware = async (req, res, next) => {
  const { email, phoneNumber } = req.body;
  if (!email && !phoneNumber) {
    return responseFailed(res, ResposeStatus.BAD_REQUEST, "Thiếu tham số");
  }

  const account = await findAccount({ email, phoneNumber });
  if (!account) {
    return responseFailed(
      res,
      ResposeStatus.NOT_FOUND,
      `Tài khoản với ${!!email ? "email" : "số điện thoại"} không tồn tại`
    );
  }

  const recipientAccount = account.dataValues;
  if (recipientAccount.accountId === req.account.accountId) {
    return responseFailed(
      res,
      ResposeStatus.BAD_REQUEST,
      `Không thể thực hiện với tài khoản này`
    );
  }

  req.recipientAccount = recipientAccount;
  next();
};

module.exports = { exitsAccountMiddleware };
