const express = require("express");
const ElectricMeterRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
module.exports = ElectricMeterRouter;
