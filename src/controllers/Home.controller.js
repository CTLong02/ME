const Home = require("../models/Home");

const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");

const ResponseStatus = require("../config/constant/response_status");

const { createHome, getHomesByAccountId } = require("../services/Home.service");

const addHome = async (req, res) => {
  try {
    const { accountId } = req.account;
    const { homename } = req.body;
    if (!homename) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const home = await createHome({ accountId, homename });
    if (home) {
      const homes = (await getHomesByAccountId(accountId)).map((home) => {
        const { accountId, ...data } = home.dataValues;
        return data;
      });
      return responseSuccess(res, ResponseStatus.SUCCESS, { homes });
    }
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
  }
};

const renameHome = async (req, res) => {
  try {
    const { homename, homeId } = req.body;
    const { accountId } = req.account;
    if (!homename) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const home = await Home.findOne({
      where: { homeId, accountId },
    });
    if (!home) {
      return responseFailed(res, ResponseStatus.NOT_FOUND, "Nhà không tồn tại");
    }
    home.homename = homename;
    await home.save();
    const { ...dataHome } = home.dataValues;
    delete dataHome.accountId;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      home: dataHome,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
  }
};

module.exports = { renameHome, addHome };
