const { findRoomByRoomId } = require("../services/Room.service");
const {
  responseFailed,
  responseSuccess,
} = require("../utils/helper/RESTHelper");
const ResponseStatus = require("../config/constant/response_status");
const ElectricMeter = require("../models/ElectricMeter");
const addEM = async (req, res) => {
  try {
    const { roomId, eletricMeterId } = req.body;
    if (!!roomId && !!eletricMeterId) {
      return responseFailed(ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }

    const findedEM = await ElectricMeter.findOne({ where: eletricMeterId });
    if (!findedEM) {
      return responseFailed(
        ResponseStatus.NOT_FOUND,
        "Không tìm thấy thiết bị"
      );
    }

    if (findedEM) {
    }
  } catch (error) {}
};

module.exports = { addEM };
