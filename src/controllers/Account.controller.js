const {
  createAccountByEmailService,
  createAccountByPhoneNumberService,
  findAccountByEmailService,
  findAccountByPhoneNumberService,
  findAccountByEmailAndPass,
  joinAccount,
  getListInvitationInformation,
} = require("../services/Account.service");
const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const { createToken } = require("../utils/jwt");
const {
  createAccessToken,
  deleteAccessToken,
} = require("../services/Token.service");
const { TIME_TOKEN } = require("../config/constant/constant_time");
const {
  findInvitationsByAccountId,
} = require("../services/Invitation.service");

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
      const join = await joinAccount(findedAccountByEmailAndPass.accountId);
      const accessToken = createToken(findedAccountByEmailAndPass);
      await deleteAccessToken(findedAccountByEmailAndPass.accountId);
      const token = await createAccessToken({
        accountId: findedAccountByEmailAndPass.accountId,
        token: accessToken,
      });
      setTimeout(() => {
        deleteAccessToken(findedAccountByEmailAndPass.accountId);
      }, TIME_TOKEN);
      return responseSuccess(res, ResponseStatus.SUCCESS, {
        account: { ...join, accessToken },
      });
    }
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

// Đăng xuất
const signOut = async (req, res) => {
  try {
    const { accountId } = req.account;
    await deleteAccessToken(accountId);
    responseSuccess(res, ResponseStatus.SUCCESS);
  } catch (error) {
    return responseFailed(
      res,
      ResponseStatus.INTERNAL_SERVER_ERROR,
      "Xảy ra lỗi khi đăng xuất"
    );
  }
};

//Lấy danh sách lời mời
const getListInvitation = async (req, res) => {
  try {
    const { accountId } = req.account;
    const invitations = await getListInvitationInformation(accountId);
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      invitations: invitations.map((invitation) => {
        const { electricMeter, account, ...data } = invitation.dataValues;
        return data;
      }),
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_GATEWAY, "Xảy ra lỗi");
  }
};

module.exports = { signUp, signIn, signOut, getListInvitation };
