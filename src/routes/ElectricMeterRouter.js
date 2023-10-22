const express = require("express");
const ElectricMeterRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { addEM } = require("../controllers/ElectricMeter.controller");
ElectricMeterRouter.post("/add-em", authMiddleware, addEM);
module.exports = ElectricMeterRouter;
