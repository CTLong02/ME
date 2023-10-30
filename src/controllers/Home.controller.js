const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const Home = require("../models/Home");
const { findHome } = require("../services/Home.service");
const getHomes = async (req, res) => {};
const renameHome = async (req, res) => {
  try {
    const { name, homeId } = req.body;
    const { accountId } = req.account;
    if (!name) {
      responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const home = await Home.findOne({
      where: { homeId, accountId },
    });
    if (!home) {
      return responseFailed(res, ResponseStatus.NOT_FOUND, "Nhà không tồn tại");
    }
    home.name = name;
    await home.save();
    const { createdAt, updatedAt, ...dataHome } = home.dataValues;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      home: dataHome,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
  }
};

module.exports = { getHomes, renameHome };
