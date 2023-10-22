const {
  createAccountByEmailService,
  createAccountByPhoneNumberService,
  findAccountByEmailService,
  findAccountByPhoneNumberService,
  findAccountByEmailAndPass,
  joinWithEM,
} = require("../services/Account.service");
const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const { createToken } = require("../utils/jwt");
const { createAccessToken } = require("../services/Token.service");
const moment = require("moment");

//Tạo tài khoản
const signUp = async (req, res) => {
  try {
    const { email, password, phoneNumber } = req.body;
    if (
      (!email && !password && !phoneNumber) ||
      ((!email || !password) && phoneNumber)
    ) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    if (phoneNumber) {
      const findedAccount = await findAccountByPhoneNumberService(phoneNumber);
      if (findedAccount) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Tài khoản với số điện thoại này đã tồn tại"
        );
      }
      const createdAccount = await createAccountByPhoneNumberService(
        phoneNumber
      );
      if (createdAccount) {
        return responseSuccess(res, ResponseStatus.SUCCESS, {
          account: createdAccount,
        });
      }
    } else {
      const findedAccount = await findAccountByEmailService(email);
      if (findedAccount) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Tài khoản với email này đã tồn tại"
        );
      }
      const createdAccount = await createAccountByEmailService(email, password);
      if (createdAccount) {
        return responseSuccess(res, ResponseStatus.SUCCESS, {
          account: createdAccount,
        });
      }
    }
  } catch (error) {
    responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

// Đăng nhập
const signIn = async (req, res) => {
  const { email, password, phoneNumber } = req.body;
  try {
    if (
      (!email && !password && !phoneNumber) ||
      ((!email || !password) && phoneNumber)
    ) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    if (phoneNumber) {
      const findedAccountByPhone = await findAccountByPhoneNumberService(
        phoneNumber
      );
      if (!findedAccountByPhone) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Tài khoản với số điện thoại này không tồn tại"
        );
      }
    } else {
      const findedAccountByEmail = await findAccountByEmailService(email);
      if (!findedAccountByEmail) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Tài khoản với email này không tồn tại"
        );
      }
      const findedAccountByEmailAndPass = await findAccountByEmailAndPass(
        email,
        password
      );
      if (!findedAccountByEmailAndPass) {
        return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai mật khẩu");
      }
      const join = await joinWithEM(findedAccountByEmailAndPass.accountId);
      const accessToken = createToken(findedAccountByEmailAndPass);
      const token = await createAccessToken({
        accountId: findedAccountByEmailAndPass.accountId,
        token: accessToken,
      });
      return responseSuccess(res, ResponseStatus.SUCCESS, {
        account: { ...join, accessToken },
      });
    }
  } catch (error) {
    console.log(moment().format("LTS"), "error", error.message);
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

module.exports = { signUp, signIn };
