const { RESPONSE_COMAND } = require("../config/constant/command");
const { insertNewscast } = require("../services/Newscast.service");
const { addEM } = require("./ElectricMeter.service");
const publish = () => {};

const onMessage = (topic, payload) => {
  const message = JSON.parse(payload.toString());
  const { command, ...data } = message;
  switch (command) {
    case RESPONSE_COMAND.NEWSCAST:
      insertNewscast(data);
      break;
    case RESPONSE_COMAND.INFOR_EM:
      addEM(data);
      break;
    default:
  }
};

module.exports = { onMessage, publish };
