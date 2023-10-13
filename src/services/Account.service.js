const Account = require("../models/Account");
const { hashPw } = require("../utils/helper/AccountHelper");
const {
  responseSuccessService,
  responseFailedService,
} = require("../utils/helper/RESTHelper");
const createAccountByEmailService = async (email, pass) => {
  try {
    const passHash = hashPw(pass);
    const account = await Account.create({ email, pass: passHash }, {});
    return account;
  } catch (error) {
    return null;
  }
};
const createAccountByPhoneNumberService = async (phoneNumber) => {
  try {
    const account = await Account.create({ phoneNumber });
    return account;
  } catch (error) {
    return null;
  }
};

const findAccountByEmailService = async (email) => {
  try {
    const account = await Account.findOne({ where: { email } });
    if (account) {
      return account;
    }
    return null;
  } catch (error) {
    return null;
  }
};
const findAccountByPhoneNumberService = async (phoneNumber) => {
  try {
    const account = await Account.findOne({ where: { phoneNumber } });
    if (account) {
      return account;
    }
    return null;
  } catch (error) {
    return null;
  }
};
module.exports = {
  createAccountByEmailService,
  createAccountByPhoneNumberService,
  findAccountByEmailService,
  findAccountByPhoneNumberService,
};
