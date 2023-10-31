const { Sequelize, Op } = require("sequelize");
const Account = require("../models/Account");
const Home = require("../models/Home");
const Room = require("../models/Room");
const ElectricMeter = require("../models/ElectricMeter");
const ElectricMeterShare = require("../models/ElectricMeterShare");
const { hashPw, comparePw } = require("../utils/helper/AccountHelper");
const {
  responseSuccessService,
  responseFailedService,
} = require("../utils/helper/RESTHelper");
const createAccountByEmailService = async (email, pass) => {
  try {
    const passHash = hashPw(pass);
    const account = await Account.create({ email, pass: passHash });
    delete account.dataValues.pass;
    return account.dataValues;
  } catch (error) {
    return null;
  }
};
const createAccountByPhoneNumberService = async (phoneNumber) => {
  try {
    const account = await Account.create({ phoneNumber });
    delete account.dataValues.pass;
    return account;
  } catch (error) {
    return null;
  }
};

const findAccountByEmailService = async (email) => {
  try {
    const account = await Account.findOne({
      where: { email },
      attributes: { exclude: ["pass"] },
    });
    if (account) {
      return account.dataValues;
    }
    return null;
  } catch (error) {
    return null;
  }
};
const findAccountByPhoneNumberService = async (phoneNumber) => {
  try {
    const account = await Account.findOne({
      where: { phoneNumber },
      attributes: { exclude: ["pass"] },
    });
    if (account) {
      delete account.dataValues.pass;
      return account.dataValues;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const findAccountByEmailAndPass = async (email, pass) => {
  try {
    const account = await Account.findOne({
      where: { email },
    });
    const comparePass = comparePw(pass, account.pass);
    if (!!account && comparePass) {
      return account.dataValues;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const joinAccount = async (accountId) => {
  try {
    const account = await Account.findOne({
      where: { accountId },
      attributes: { exclude: ["createdAt", "updatedAt", "pass"] },
      include: [
        {
          model: Home,
          attributes: { exclude: ["createdAt", "updatedAt", "accountId"] },
          as: "homes",
          order: [["createdAt", "ASC"]],
          include: [
            {
              model: Room,
              attributes: { exclude: ["createdAt", "updatedAt", "homeId"] },
              order: [["createdAt", "ASC"]],
              as: "rooms",
              required: true,
              include: [
                { model: ElectricMeter, as: "electricMeters", required: true },
              ],
            },
          ],
        },
      ],
    });
    return account.dataValues;
  } catch (error) {
    return null;
  }
};
module.exports = {
  createAccountByEmailService,
  createAccountByPhoneNumberService,
  findAccountByEmailService,
  findAccountByPhoneNumberService,
  findAccountByEmailAndPass,
  joinAccount,
};
