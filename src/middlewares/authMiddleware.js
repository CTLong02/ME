const jwt = require("jsonwebtoken");
const resposeStatus = require("../config/constant/response_status");
const { responseFailed } = require("../utils/helper/RESTHelper");
const Token = require("../models/Token");
const authMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return responseFailed(
      res,
      resposeStatus.UNAUTHORIZED,
      "Không có quyền truy cập"
    );
  }

  const authrizationKey = authorization.split(" ")[0];
  const token = authorization.split(" ")[1];
  if (!authrizationKey || !token || authrizationKey != "Bearer") {
    return responseFailed(
      res,
      resposeStatus.UNAUTHORIZED,
      "Không có quyền truy cập"
    );
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_KEY);
    req.account = decode;
    const accessToken = await Token.findOne({
      where: { accountId: decode.accountId },
    });
    if (!accessToken) {
      return responseFailed(
        res,
        resposeStatus.UNAUTHORIZED,
        "Không có quyền truy cập"
      );
    }
    next();
  } catch (error) {
    return responseFailed(
      res,
      resposeStatus.FORBIDDEN,
      "Hết hạn quyền truy cập"
    );
  }
};
module.exports = authMiddleware;
