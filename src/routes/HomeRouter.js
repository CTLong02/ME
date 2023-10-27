const express = require("express");
const HomeRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { URL_HOME } = require("../config/constant/urls");
const HomeController = require("../controllers/Home.controller");

HomeRouter.get(URL_HOME.getHomes, [authMiddleware], HomeController.getHomes);

module.exports = HomeRouter;
