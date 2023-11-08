const {
  TYPE_CONNECT_NUMBER,
  UPDATE_FIRMWARE_NUMBER,
  UPDATE_FIRMWARE,
  TYPE_CONNECT,
} = require("../../config/constant/constant_model");
const handleUpdateFirmware = (update) => {
  switch (update) {
    case UPDATE_FIRMWARE_NUMBER.not_update:
      return UPDATE_FIRMWARE.not_update;
    case UPDATE_FIRMWARE_NUMBER.update_fail:
      return UPDATE_FIRMWARE.update_fail;
    case UPDATE_FIRMWARE_NUMBER.update_success:
      return UPDATE_FIRMWARE.update_success;
    case UPDATE_FIRMWARE_NUMBER.updating:
      return UPDATE_FIRMWARE.updating;
    default:
      return UPDATE_FIRMWARE.not_update;
  }
};

const handleConn = (conn) => {
  switch (conn) {
    case TYPE_CONNECT_NUMBER._3G_4G:
      return TYPE_CONNECT._3G_4G;
    case TYPE_CONNECT_NUMBER.ethernet:
      return TYPE_CONNECT.ethernet;
    case TYPE_CONNECT_NUMBER.wifi:
      return TYPE_CONNECT.wifi;
    default:
      return TYPE_CONNECT.wifi;
  }
};

const toFloat2 = (value) => {
  return Number.parseFloat(value.toFixed(2));
};

module.exports = { handleUpdateFirmware, handleConn, toFloat2 };
