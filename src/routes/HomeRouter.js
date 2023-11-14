const express = require("express");
const HomeRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { URL_HOME } = require("../config/constant/urls");
const HomeController = require("../controllers/Home.controller");

HomeRouter.get(URL_HOME.getHomes, [authMiddleware], HomeController.getHomes);
HomeRouter.post(URL_HOME.add, [authMiddleware], HomeController.addHome);
HomeRouter.put(URL_HOME.rename, [authMiddleware], HomeController.renameHome);

module.exports = HomeRouter;
