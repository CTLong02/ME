const express = require("express");
const ElectricMeterRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { exitsAccountMiddleware } = require("../middlewares/accountMiddleware");
const {
  permisionEmMiddleware,
  exitsEMMiddleware,
} = require("../middlewares/emMiddleware");
const {
  addEM,
  shareEm,
  acceptEmShare,
  rejectEMShare,
  getEms,
  getAllTimers,
  viewDetailEm,
  controlEm,
  restartEm,
  scanWifi,
  viewReportByDay,
  viewReportByMonth,
  viewReportByYear,
  renameEm,
  moveToRoom,
  getAccountSharedList,
  deleteShareAccounts,
  getAllNewscast,
  changeEnergyValue,
  createData,
} = require("../controllers/ElectricMeter.controller");
const { URL_EM } = require("../config/constant/urls");
ElectricMeterRouter.post(URL_EM.addEm, authMiddleware, addEM);
ElectricMeterRouter.post(
  URL_EM.shareEm,
  [authMiddleware, exitsAccountMiddleware, permisionEmMiddleware],
  shareEm
);

ElectricMeterRouter.put(
  URL_EM.acceptEm,
  [authMiddleware, exitsEMMiddleware],
  acceptEmShare
);

ElectricMeterRouter.put(
  URL_EM.rejectdEm,
  [authMiddleware, exitsEMMiddleware],
  rejectEMShare
);

ElectricMeterRouter.get(URL_EM.getEms, [authMiddleware], getEms);

ElectricMeterRouter.get(
  URL_EM.getAllTimers,
  [authMiddleware, permisionEmMiddleware],
  getAllTimers
);

ElectricMeterRouter.get(
  URL_EM.detailEm,
  [authMiddleware, permisionEmMiddleware],
  viewDetailEm
);

ElectricMeterRouter.put(
  URL_EM.controlEm,
  [authMiddleware, permisionEmMiddleware],
  controlEm
);

ElectricMeterRouter.put(
  URL_EM.restartEm,
  [authMiddleware, permisionEmMiddleware],
  restartEm
);

ElectricMeterRouter.get(
  URL_EM.scanWifi,
  [authMiddleware, permisionEmMiddleware],
  scanWifi
);

ElectricMeterRouter.get(
  URL_EM.viewReportByDay,
  [authMiddleware, permisionEmMiddleware],
  viewReportByDay
);

ElectricMeterRouter.get(
  URL_EM.viewReportByMonth,
  [authMiddleware, permisionEmMiddleware],
  viewReportByMonth
);

ElectricMeterRouter.get(
  URL_EM.viewReportByYear,
  [authMiddleware, permisionEmMiddleware],
  viewReportByYear
);

ElectricMeterRouter.put(
  URL_EM.renameEm,
  [authMiddleware, permisionEmMiddleware],
  renameEm
);

ElectricMeterRouter.put(
  URL_EM.moveToRoom,
  [authMiddleware, permisionEmMiddleware],
  moveToRoom
);

ElectricMeterRouter.get(
  URL_EM.sharedList,
  [authMiddleware, permisionEmMiddleware],
  getAccountSharedList
);
ElectricMeterRouter.delete(
  URL_EM.deleteShareAccount,
  [authMiddleware, permisionEmMiddleware],
  deleteShareAccounts
);

ElectricMeterRouter.get(
  URL_EM.getAllNewscast,
  [authMiddleware, permisionEmMiddleware],
  getAllNewscast
);

ElectricMeterRouter.put(
  URL_EM.changeEnergyValue,
  [authMiddleware, permisionEmMiddleware],
  changeEnergyValue
);

ElectricMeterRouter.post(URL_EM.createData, [authMiddleware], createData);

module.exports = ElectricMeterRouter;
