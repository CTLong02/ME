const { differenceInMilliseconds } = require("date-fns");
const client = require("../config/mqtt/connect");
const { RESPONSE_COMAND } = require("../config/constant/command");
const { addEM, findEMById, updateEm } = require("./ElectricMeter.service");
const {
  handleConn,
  handleUpdateFirmware,
} = require("../utils/helper/AppHelper");
const { createEnergy, findEnergy } = require("./Energy.service");
const {
  createEnergyChange,
  getLastEnergyChange,
} = require("./EnergyChange.service");
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
  const em = await findEMById(electricMeterId);
  console.log(moment().format("LTS"), topic, message);
  switch (command) {
    case RESPONSE_COMAND.NEWSCAST:
      const {
        ID,
        Conn,
        Signal,
        Strength,
        Voltage,
        Current,
        Power,
        Energy,
        Temp,
        Load,
        Update,
      } = data;
      if (em) {
        await updateEm({
          electricMeterId: ID,
          conn: handleConn(Conn.toString()),
          signal: Signal,
          strength: Strength,
          voltage: Voltage,
          current: Current,
          power: Power,
          energy: Energy,
          temp: Temp,
          load: Load,
          updateState: handleUpdateFirmware(Update.toString()),
        });
      } else {
        await addEM({
          ...data,
          Ver: "1.0",
          Net: "VINAPHONE",
          SimImei: "123abc456",
          Ssid: "Mdc",
          Pass: "888888888",
          Rtc: 1,
        });
      }
      const datetime = new Date(Date.now());
      const energy = await findEnergy({
        electricMeterId,
        hour: datetime.getHours(),
        day: datetime.getDate(),
        month: datetime.getMonth(),
        year: datetime.getFullYear(),
      });
      if (energy) {
        energy.lastValue = Energy;
        await energy.save();
      } else {
        createEnergy({ electricMeterId, firstValue: Energy });
      }
      break;
    case RESPONSE_COMAND.CHANGE_EM:
      const { value } = data;
      const lastEnergyChange = await getLastEnergyChange(electricMeterId);
      if (em) {
        if (
          !lastEnergyChange ||
          differenceInMilliseconds(
            lastEnergyChange.datetime,
            new Date(Date.now())
          ) >
            60 * 1000
        ) {
          createEnergyChange({
            electricMeterId,
            preValue: em.energy,
            curValue: value,
          });
        } else {
          createEnergyChange({
            electricMeterId,
            preValue: lastEnergyChange.curValue,
            curValue: value,
          });
        }
      }
      break;
    case RESPONSE_COMAND.INFOR_EM:
      addEM(data);
      break;
    default:
  }
};

module.exports = { onMessage, publish };
