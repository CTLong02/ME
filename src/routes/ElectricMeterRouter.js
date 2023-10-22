const express = require("express");
const ElectricMeterRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { addEM, shareEm } = require("../controllers/ElectricMeter.controller");
ElectricMeterRouter.post("/add-em", authMiddleware, addEM);
ElectricMeterRouter.post("/share-em", authMiddleware, shareEm);
module.exports = ElectricMeterRouter;
