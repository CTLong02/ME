const { RESPONSE_COMAND } = require("../config/constant/command");
const { insertNewscast } = require("../services/Newscast.service");
const { addEM } = require("./ElectricMeter.service");
const {
  createEnergyChange,
  getLastEnergyChange,
} = require("./EnergyChange.service");
const { getLastNewscast } = require("./Newscast.service");
const client = require("../config/mqtt/connect");
const moment = require("moment");
const publish = async ({ electricMeterId, command, data }) => {
  const message = { command, ...data };
  const topic = `SM_EL_MT/${electricMeterId}/sub`;
  const payload = JSON.stringify(message);
  if (client.connected) {
    await client.publishAsync(topic, payload);
  }
};

const onMessage = async (topic, payload) => {
  const message = JSON.parse(payload.toString());
  const { command, ...data } = message;
  const electricMeterId = topic.split("/")[1];
  console.log(moment().format("LTS"), topic, message);
  switch (command) {
    case RESPONSE_COMAND.NEWSCAST:
      insertNewscast(data);
      break;
    case RESPONSE_COMAND.CHANGE_EM:
      const lastNewscast = await getLastNewscast(electricMeterId);
      const lastEnergyChange = await getLastEnergyChange(electricMeterId);
      let distance;
      const newEnergyValue = message.value;
      if (
        !lastEnergyChange ||
        lastNewscast.createdAt > lastEnergyChange.createdAt
      ) {
        distance = lastNewscast.energy - newEnergyValue;
      } else {
        distance =
          lastNewscast.energy - lastEnergyChange.volume - newEnergyValue;
      }
      const volume = Number.parseFloat(distance.toFixed(2));
      createEnergyChange({ electricMeterId, volume });
      break;
    case RESPONSE_COMAND.INFOR_EM:
      addEM(data);
      break;
    default:
  }
};

module.exports = { onMessage, publish };
