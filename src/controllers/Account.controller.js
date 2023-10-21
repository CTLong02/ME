const Account = require("../models/Account");
const Home = require("../models/Home");
const Room = require("../models/Room");
const ElectricMeter = require("../models/ElectricMeter");
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
const { createRoom } = require("../services/Room.service");
const { createHome } = require("../services/Home.service");
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

// Thêm công tơ vào tài khoản
const addEM = async (req, res) => {
  try {
    const { roomId, homeId, electricMeterId, roomname, homename } = req.body;
    if (!roomId && !electricMeterId) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }

    if (!electricMeterId) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Thiếu mã công tơ số"
      );
    }

    const findedEM = await ElectricMeter.findOne({
      where: { electricMeterId },
    });
    if (!findedEM) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Không tìm thấy công tơ"
      );
    }

    if (!!findedEM.roomId) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Công tơ đã được kết nối với tài khoản khác"
      );
    }

    const account = await Account.findOne({
      where: { accountId: req.account.accountId },
      include: [
        {
          model: Home,
          nested: false,
          attributes: { exclude: ["createdAt", "updatedAt"] },
          include: [
            {
              model: Room,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
          ],
        },
      ],
    });

    if (roomId) {
      const rooms = account.dataValues?.homes?.rooms.map((e) => e.roomId);
      if (rooms && Array.isArray(rooms) && rooms.includes(roomId)) {
        findedEM.roomId = roomId;
        await findedEM.save();
        return responseSuccess(res, ResponseStatus.SUCCESS, {
          homes: account.dataValues.homes,
        });
      }
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Bạn không sở hữu phòng này"
      );
    }

    if (homeId) {
      const homes = account.dataValues?.homes.map((e) => e.homeId);
      if ((!homes && !Array.isArray(homes)) || homes.includes(homeId)) {
        return responseFailed(
          res,
          ResponseStatus.BAD_REQUEST,
          "Bạn không sở hữu nhà này"
        );
      }
      const homeById = await Home.findOne({
        where: { homeId },
        include: [{ model: Room }],
      });
      const room = await createRoom({
        name: !!roomname
          ? roomname
          : `Phòng ${homeById.dataValues.rooms.length + 1}`,
        homeId,
      });

      findedEM.roomId = room.roomId;
      await findedEM.save();
      return responseSuccess(res, ResponseStatus.SUCCESS, {
        homes: account.dataValues.homes,
      });
    }

    const home = await createHome({
      accountId: req.account.accountId,
      name: !!homename
        ? homename
        : `Nhà ${account.dataValues?.homes.length + 1}`,
    });
    const room = await createRoom({
      name: !!roomname ? roomname : "Phòng 1",
      homeId: home.homeId,
    });
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      homes: account.dataValues.homes,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
  }
};

module.exports = { signUp, signIn, addEM };
