const express = require("express");
const AccountRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { signUp, signIn } = require("../controllers/Account.controller");
const { URL_ACCOUNT } = require("../config/constant/urls");

AccountRouter.post(URL_ACCOUNT.signUp, signUp);
AccountRouter.post(URL_ACCOUNT.signIn, signIn);

module.exports = AccountRouter;
