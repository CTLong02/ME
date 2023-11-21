const express = require("express");
const AccountRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const AccountController = require("../controllers/Account.controller");
const { URL_ACCOUNT } = require("../config/constant/urls");

AccountRouter.post(URL_ACCOUNT.signUp, AccountController.signUp);
AccountRouter.post(URL_ACCOUNT.signIn, AccountController.signIn);
AccountRouter.post(
  URL_ACCOUNT.signOut,
  [authMiddleware],
  AccountController.signOut
);

AccountRouter.get(
  URL_ACCOUNT.listInvitation,
  [authMiddleware],
  AccountController.getListInvitation
);

AccountRouter.post(
  URL_ACCOUNT.getOTPForSignIn,
  [authMiddleware],
  AccountController.getOTPForSignIn
);

AccountRouter.post(
  URL_ACCOUNT.getOTPForSignUp,
  [authMiddleware],
  AccountController.getOTPForSignUp
);

module.exports = AccountRouter;
