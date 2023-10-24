const { responseFailed } = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const { joinAccount } = require("../services/Account.service");
const {
  findEMById,
  findAccountById,
} = require("../services/ElectricMeter.service");
const ownEMMiddleware = async (req, res, next) => {
  try {
    const { electricMeterId } = req.body;
    if (!electricMeterId) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Thiếu tham số  mã công tơ"
      );
    }
    const accountId = req.account.accountId;
    const findedEM = await findEMById(electricMeterId);
    if (!findedEM) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Không tìm thấy thiết bị"
      );
    }
    const findAccountByEMId = await findAccountById(electricMeterId);
    if (!findAccountByEMId || accountId !== findAccountByEMId.accountId) {
      return responseFailed(
        res,
        ResponseStatus.FORBIDDEN,
        "Bạn không được cho phép"
      );
    }
    const { room, ...em } = findAccountByEMId;
    req.em = em;
    next();
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

const permisionEmMiddleware = async (req, res, next) => {
  try {
    const { electricMeterId } = req.body;
    if (!electricMeterId) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Thiếu tham số  mã công tơ"
      );
    }
    const accountId = req.account.accountId;
    const findedEM = await findEMById(electricMeterId);
    if (!findedEM) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Không tìm thấy thiết bị"
      );
    }
    const findAccountByEMId = await findAccountById(electricMeterId);
    if (!findAccountByEMId || accountId !== findAccountByEMId.accountId) {
      return responseFailed(
        res,
        ResponseStatus.FORBIDDEN,
        "Bạn không được cho phép"
      );
    }
    const { room, ...em } = findAccountByEMId;
    req.em = em;
    next();
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

module.exports = { ownEMMiddleware, permisionEmMiddleware };
