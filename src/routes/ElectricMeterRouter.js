const express = require("express");
const ElectricMeterRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { exitsAccountMiddleware } = require("../middlewares/accountMiddleware");
const { ownEMMiddleware } = require("../middlewares/emMiddleware");
const { addEM, shareEm } = require("../controllers/ElectricMeter.controller");
ElectricMeterRouter.post("/add-em", authMiddleware, addEM);
ElectricMeterRouter.post(
  "/share-em",
  [authMiddleware, exitsAccountMiddleware, ownEMMiddleware],
  shareEm
);
module.exports = ElectricMeterRouter;
