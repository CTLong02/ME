const { RESPONSE_RESULT } = require("../../config/constant/contants_app");
const responseSuccess = (res, status, data) => {
  return res.status(status).send({
    result: RESPONSE_RESULT.SUCCESS,
    ...data,
  });
};

const responseFailed = (res, status, reason) => {
  return res.status(status).send({
    result: RESPONSE_RESULT.SUCCESS,
    reason,
  });
};

module.exports = { responseSuccess, responseFailed };
