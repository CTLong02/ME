const Account = require("../models/Account");
const ElectricMeter = require("../models/ElectricMeter");
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
    return account;
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
      console.log("account", account);
      return account.dataValues;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const joinWithEM = async (accountId) => {
  try {
    const join = await Account.findOne({
      where: { accountId },
      attributes: { exclude: ["createdAt", "updatedAt"] },
      // include: [
      //   {
      //     model: ElectricMeter,
      //     attributes: { exclude: ["accountId", "createdAt", "updatedAt"] },
      //   },
      // ],
    });
    return join.dataValues;
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
  joinWithEM,
};
