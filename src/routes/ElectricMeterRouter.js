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
} = require("../controllers/ElectricMeter.controller");
const { URL_EM } = require("../config/constant/urls");
ElectricMeterRouter.post(URL_EM.addEm, authMiddleware, addEM);
ElectricMeterRouter.post(
  URL_EM.shareEm,
  [authMiddleware, exitsAccountMiddleware, permisionEmMiddleware],
  shareEm
);

ElectricMeterRouter.post(
  URL_EM.acceptEm,
  [authMiddleware, exitsEMMiddleware],
  acceptEmShare
);

ElectricMeterRouter.post(
  URL_EM.rejectdEm,
  [authMiddleware, exitsEMMiddleware],
  rejectEMShare
);

ElectricMeterRouter.get(URL_EM.getEms, [authMiddleware], getEms);

module.exports = ElectricMeterRouter;
