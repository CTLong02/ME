const express = require("express");
const RoomRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { URL_ROOM } = require("../config/constant/urls");
const RoomController = require("../controllers/Room.controller");

RoomRouter.put(URL_ROOM.rename, [authMiddleware], RoomController.renameRoom);

module.exports = RoomRouter;
