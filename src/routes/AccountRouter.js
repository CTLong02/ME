const express = require("express");
const AccountRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { signUp, signIn, addEM } = require("../controllers/Account.controller");

AccountRouter.post("/sign-up", signUp);
AccountRouter.post("/sign-in", signIn);
AccountRouter.post("/add-em", authMiddleware, addEM);

module.exports = AccountRouter;
