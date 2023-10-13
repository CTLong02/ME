const {
  createAccountByEmailService,
  createAccountByPhoneNumberService,
  findAccountByEmailService,
  findAccountByPhoneNumberService,
} = require("../services/Account.service");
const { RESPONSE_RESULT } = require("../config/constant/contants_app");
const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const StatusResponse = require("../config/constant/response_status");

//Tạo tài khoản
const signUp = async (req, res) => {
  try {
    const { email, password, phoneNumber } = req.body;
    if (
      (!email && !password && !phoneNumber) ||
      ((!email || !password) && phoneNumber)
    ) {
      responseFailed(res, StatusResponse.BAD_REQUEST, "Thiếu tham số");
    }
    if (phoneNumber) {
      const findedAccount = await findAccountByPhoneNumberService(phoneNumber);
      if (findedAccount) {
        responseFailed(
          res,
          StatusResponse.BAD_REQUEST,
          "Tài khoản với số điện thoại này đã tồn tại"
        );
      }
      const createdAccount = await createAccountByPhoneNumberService(
        phoneNumber
      );
      if (createdAccount) {
        responseSuccess(res, StatusResponse.SUCCESS, {
          account: createdAccount,
        });
      }
    } else {
      const findedAccount = await findAccountByEmailService(email);
      if (findedAccount) {
        responseFailed(
          res,
          StatusResponse.BAD_REQUEST,
          "Tài khoản với email này đã tồn tại"
        );
      }
      const createdAccount = await createAccountByEmailService(email, password);
      if (createdAccount) {
        responseSuccess(res, StatusResponse.SUCCESS, {
          account: createdAccount,
        });
      }
    }
  } catch (error) {
    responseFailed(res, StatusResponse.BAD_REQUEST, "Thiếu tham số");
  }
};

const signIn = async (req, res) => {};

module.exports = { signUp, signIn };
