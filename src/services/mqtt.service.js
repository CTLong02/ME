const { differenceInMilliseconds, setHours } = require("date-fns");
const moment = require("moment");

const client = require("../config/mqtt/connect");

const {
  RESPONSE_COMAND_MQTT,
  RESPONSE_COMAND_SOCKET,
} = require("../config/constant/command");
const { TIMER_ACTION_ID } = require("../config/constant/constant_model");
const {
  handleConn,
  handleUpdateFirmware,
} = require("../utils/helper/AppHelper");

const { addEM, findEMById, updateEm } = require("./ElectricMeter.service");
const { createEnergy, findEnergy } = require("./Energy.service");
const { createTimers, deleteAllTimers } = require("./Timer.service");
const {
  createEnergyChange,
  getLastEnergyChange,
} = require("./EnergyChange.service");

const MQTTClient = () => {
  client.on("connect", () => {
    client.subscribe("SM_EL_MT/#", { qos: 1 }, () => {});
  });

  client.on("message", (topic, payload) => {
    onMessage(topic, payload);
  });
};

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
  const {
    ID,
    Ver,
    Net,
    SimImei,
    Conn,
    Signal,
    Strength,
    Ssid,
    Pass,
    Rtc,
    Voltage,
    Current,
    Power,
    Energy,
    Temp,
    Load,
    Update,
  } = data;
  console.log(moment().format("LTS"), topic, message);
  switch (command) {
    case RESPONSE_COMAND_MQTT.NEWSCAST:
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
      const datetime = new Date();
      const energy = await findEnergy({
        electricMeterId,
        hour: datetime.getHours(),
        date: datetime,
      });
      if (energy) {
        energy.lastValue = Energy;
        await energy.save();
      } else {
        const newDate = setHours(datetime, datetime.getHours() - 1);
        const preEnergy = await findEnergy({
          electricMeterId,
          hour: newDate.getHours(),
          date: newDate,
        });
        if (preEnergy) {
          createEnergy({
            electricMeterId,
            firstValue: preEnergy.lastValue,
            lastValue: Energy,
          });
        } else {
          createEnergy({
            electricMeterId,
            firstValue: Energy,
            lastValue: Energy,
          });
        }
      }
      break;
    case RESPONSE_COMAND_MQTT.CHANGE_EM:
      const { value } = data;
      const lastEnergyChange = await getLastEnergyChange(electricMeterId);
      if (em) {
        if (
          !lastEnergyChange ||
          differenceInMilliseconds(new Date(), lastEnergyChange.datetime) >
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
    case RESPONSE_COMAND_MQTT.INFOR_EM:
      if (em) {
        updateEm({
          electricMeterId,
          ver: Ver,
          net: Net,
          simImei: SimImei,
          conn: Conn,
          signal: Signal,
          strength: Strength,
          ssid: Ssid,
          pass: Pass,
          rtc: Rtc,
        });
      } else {
        addEM(data);
      }
      break;
    case RESPONSE_COMAND_MQTT.TIMER:
      const { Timeon, Dailyon, Timeoff, Dailyoff } = data;
      const timers = [];
      for (let i = 0; i < Timeon.length; i++) {
        if (Dailyon[i] === 0) {
          continue;
        }
        timers.push({
          electricMeterId,
          actionId: TIMER_ACTION_ID.on,
          time: Timeon[i],
          daily: Dailyon[i],
        });
      }
      for (let j = 0; j < Timeoff.length; j++) {
        if (Dailyoff[j] === 0) {
          continue;
        }
        timers.push({
          electricMeterId,
          actionId: TIMER_ACTION_ID.off,
          time: Timeoff[j],
          daily: Dailyoff[j],
        });
      }
      await deleteAllTimers(electricMeterId);
      await createTimers(timers);
      break;
    case RESPONSE_COMAND_MQTT.RESTART:
      const { Status } = command;
      updateEm({ load: Status });
      break;
    default:
  }
};

module.exports = { onMessage, publish, MQTTClient };
