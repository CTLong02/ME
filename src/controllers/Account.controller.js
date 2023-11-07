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
const { createToken } = require("../utils/jwt");
const {
  createAccessToken,
  deleteAccessToken,
} = require("../services/Token.service");
const { TIME_TOKEN } = require("../config/constant/constant_time");
const { hashPw, comparePw } = require("../utils/helper/AccountHelper");

//Tạo tài khoản
const signUp = async (req, res) => {
  try {
    const { email, password, phoneNumber } = req.body;
    if (!(email && password) && !phoneNumber) {
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
    const pass = password ? hashPw(password) : null;
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
  const { email, password, phoneNumber } = req.body;
  try {
    if (!(email && password) && !phoneNumber) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
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

module.exports = { signUp, signIn, signOut, getListInvitation };
