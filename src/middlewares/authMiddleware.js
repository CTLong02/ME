const jwt = require("jsonwebtoken");
const resposeStatus = require("../config/constant/response_status");
const { responseFailed } = require("../utils/helper/RESTHelper");
const authMiddleware = (req, res, next) => {
  const authrization = req.headers.authrization;
  if (!authrization) {
    return responseFailed(
      res,
      resposeStatus.UNAUTHORIZED,
      "Không có quyền truy cập"
    );
  }

  const authrizationKey = authrization.split(" ")[0];
  const token = authrization.split(" ")[1];
  if (!authrizationKey || !token || authrizationKey != "Bearer") {
    return responseFailed(
      res,
      resposeStatus.UNAUTHORIZED,
      "Không có quyền truy cập"
    );
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_KEY);
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
