const { differenceInMilliseconds } = require("date-fns");
const {
  createAccount,
  findAccount,
  getListInvitationByAccountId,
  getAllInfor,
} = require("../services/Account.service");
const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const { TIME_OTP } = require("../config/constant/constant_time");
const {
  createAccessToken,
  deleteAccessToken,
} = require("../services/Token.service");
const { sendOTP } = require("../services/Twilo.service");
const {
  createOtp,
  deleteOtp,
  findOtp,
  deleteOtpById,
} = require("../services/Otp.service");
const { createToken } = require("../utils/jwt");
const {
  createAccountDTO,
  phoneNumberDTO,
} = require("../utils/joi/account.joi");
const {
  hashPw,
  comparePw,
  hashOtp,
  compareOtp,
} = require("../utils/helper/AccountHelper");

//Tạo tài khoản
const signUp = async (req, res) => {
  try {
    const { email, password, phoneNumber, otp } = req.body;
    if (!(email && password) && !(phoneNumber && otp)) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const account = await findAccount({ email, phoneNumber });
    if (account) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Tài khoản đã tồn tại"
      );
    }
    const isValidateParams = createAccountDTO.validate({
      phoneNumber,
      password,
      email,
    });
    if (isValidateParams.error) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
    }
    const pass = password ? hashPw(password) : null;
    if (phoneNumber) {
      const findedOtp = await findOtp(phoneNumber);
      if (!findedOtp) {
        return responseFailed(
          res,
          ResponseStatus.NOT_FOUND,
          "Mã otp không tồn tại"
        );
      }
      const { hashedOtp, datetime } = findedOtp;
      const isCorrectOTP = compareOtp(otp, hashedOtp);
      if (
        !isCorrectOTP ||
        differenceInMilliseconds(datetime, new Date()) > TIME_OTP
      ) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Mã otp sai hoặc đã hết thời hạn"
        );
      }
    }
    const createdAccount = await createAccount({ phoneNumber, pass, email });
    const accountData = createdAccount.dataValues;
    const { accountId } = accountData;
    const token = createToken(accountData);
    await createAccessToken({ accountId, token });
    delete accountData.pass;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      account: { ...accountData, homes: [], accessToken: token },
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

// Đăng nhập
const signIn = async (req, res) => {
  const { email, password, phoneNumber, otp } = req.body;
  try {
    if (!(email && password) && !(phoneNumber && otp)) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }

    if (phoneNumber) {
      const findedOtp = await findOtp(phoneNumber);
      if (!findedOtp) {
        return responseFailed(
          res,
          ResponseStatus.NOT_FOUND,
          "Mã otp không tồn tại"
        );
      }
      const { hashedOtp, datetime } = findedOtp;
      const isCorrectOTP = compareOtp(otp, hashedOtp);
      if (
        !isCorrectOTP ||
        differenceInMilliseconds(datetime, new Date()) > TIME_OTP
      ) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Mã otp sai hoặc đã hết thời hạn"
        );
      }
    }

    const account = await getAllInfor({ email, phoneNumber });
    if (!account) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Tài khoản không tồn tại"
      );
    }
    const { homes, ...accountData } = account;
    if (email) {
      const isCorrectPassword = comparePw(password, accountData.pass);
      if (!isCorrectPassword) {
        return responseFailed(res, ResponseStatus.UNAUTHORIZED, "Sai mật khẩu");
      }
    }
    const { accountId } = accountData;
    const token = createToken(accountData);
    await deleteAccessToken(accountId);
    await createAccessToken({ accountId, token });
    delete account.pass;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      account: { ...account, accessToken: token },
    });
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
    const invitations = await getListInvitationByAccountId(accountId);
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

const getOTPForSignUp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const isValidateParams = phoneNumberDTO.validate({
      phoneNumber,
    });
    if (isValidateParams.error) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
    }
    const account = await findAccount({ phoneNumber });
    if (account) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Tài khoản đã tồn tại"
      );
    }
    const sOtp = await sendOTP(phoneNumber);
    if (!sOtp) {
      return responseFailed(
        res,
        ResponseStatus.BAD_GATEWAY,
        "Xảy ra lỗi khi gửi sms OTP"
      );
    }
    await deleteOtp(phoneNumber);
    const hashedOtp = hashOtp(sOtp);
    const otp = await createOtp({ phoneNumber, hashedOtp });
    setTimeout(() => {
      const { otpId } = otp;
      deleteOtpById(otpId);
    }, TIME_OTP);
    return responseSuccess(res, ResponseStatus.CREATED, {});
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

const getOTPForSignIn = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const isValidateParams = phoneNumberDTO.validate({
      phoneNumber,
    });
    if (isValidateParams.error) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
    }
    const account = await findAccount({ phoneNumber });
    if (!account) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Tài khoản chưa tồn tại"
      );
    }
    const sOtp = await sendOTP(phoneNumber);
    if (!sOtp) {
      return responseFailed(
        res,
        ResponseStatus.BAD_GATEWAY,
        "Xảy ra lỗi khi gửi sms OTP"
      );
    }
    await deleteOtp(phoneNumber);
    const hashedOtp = hashOtp(sOtp);
    const otp = await createOtp({ phoneNumber, hashedOtp });
    setTimeout(() => {
      const { otpId } = otp;
      deleteOtpById(otpId);
    }, TIME_OTP);
    return responseSuccess(res, ResponseStatus.CREATED, {});
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

module.exports = {
  signUp,
  signIn,
  signOut,
  getListInvitation,
  getOTPForSignUp,
  getOTPForSignIn,
};
