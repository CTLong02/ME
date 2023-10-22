const express = require("express");
const AccountRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { signUp, signIn } = require("../controllers/Account.controller");

AccountRouter.post("/sign-up", signUp);
AccountRouter.post("/sign-in", signIn);

module.exports = AccountRouter;
