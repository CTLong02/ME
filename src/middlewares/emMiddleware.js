const { responseFailed } = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const {
  API_WITH_EM_ROLE,
  EM_ROLES,
} = require("../config/constant/contants_app");
const {
  findEMById,
  findAccountByEMId,
} = require("../services/ElectricMeter.service");
const {
  findAccountByEMShareId,
} = require("../services/ElectricMeterShare.service");

const exitsEMMiddleware = async (req, res, next) => {
  try {
    let { electricMeterId } = req.body;
    electricMeterId = req.query.electricMeterId
      ? req.query.electricMeterId
      : electricMeterId;
    if (!electricMeterId) {
      responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const findedEM = await findEMById(electricMeterId);
    if (!findedEM) {
      responseFailed(res, ResponseStatus.NOT_FOUND, "Không tìm thấy thiết bị");
    }
    req.em = findedEM;
    next();
  } catch (error) {
    responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

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
    const findAccountByEMId = await findAccountByEMId(electricMeterId);
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
    let myEmRole;
    let electricMeterId = req.body.electricMeterId;
    electricMeterId = req.query.electricMeterId
      ? req.query.electricMeterId
      : electricMeterId;
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
    const url = req._parsedUrl.pathname;
    const permisionRoles = API_WITH_EM_ROLE[url];
    const findedAccountByEMId = await findAccountByEMId(electricMeterId);
    if (findedAccountByEMId && accountId === findedAccountByEMId.accountId) {
      myEmRole = EM_ROLES.owner;
    }

    if (!myEmRole) {
      const findedAccountByEMShareId = await findAccountByEMShareId(
        electricMeterId,
        req.account.accountId
      );
      if (findedAccountByEMShareId) {
        myEmRole = findedAccountByEMShareId.roleShare;
      }
    }

    if (!permisionRoles.includes(myEmRole)) {
      return responseFailed(res, ResponseStatus.FORBIDDEN, "Không có quyền");
    }

    const { room, ...em } = findedAccountByEMId;
    req.em = { ...em, role: myEmRole };
    next();
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

module.exports = { ownEMMiddleware, permisionEmMiddleware, exitsEMMiddleware };
