const { WebSocketServer, OPEN } = require("ws");
const jwt = require("jsonwebtoken");
const { differenceInMilliseconds, setHours } = require("date-fns");
const moment = require("moment");

const Token = require("../models/Token");
const client = require("../config/mqtt/connect");

const ResponseStatus = require("../config/constant/response_status");
const {
  RESPONSE_RESULT,
  EM_ROLES,
  COMMAND_SOCKET_WITH_EM_ROLE,
} = require("../config/constant/contants_app");
const {
  REQUEST_COMAND_SOCKET,
  RESPONSE_COMAND_SOCKET,
  REQUEST_COMAND_MQTT,
  RESPONSE_COMAND_MQTT,
} = require("../config/constant/command");
const {
  TIMER_ACTION_ID,
  TIMER_ACTION,
  ACCOUNT_LEVEL,
} = require("../config/constant/constant_model");

const {
  createTimerDTO,
  updateTimerDTO,
  deleteTimersDTO,
} = require("../utils/joi/timer.joi");
const {
  handleConn,
  handleUpdateFirmware,
  handleResSocketCorespondingReqSocket,
} = require("../utils/helper/AppHelper");

const {
  createTimers,
  getTimersByEMId,
  findedTimerById,
  deleteAllTimers,
} = require("./Timer.service");
const { createEnergy, findEnergy } = require("./Energy.service");
const {
  addEM,
  findEMById,
  updateEm,
  findAccountByEMId,
} = require("./ElectricMeter.service");
const {
  createEnergyChange,
  getLastEnergyChange,
} = require("./EnergyChange.service");
const { findAccountByEMShareId } = require("./ElectricMeterShare.service");

const webSocketServer = new WebSocketServer({ noServer: true, path: "/ws" });
const socketService = (server) => {
  server.on("upgrade", async (request, socket, head) => {
    authUpgrade(request, (errCode, account) => {
      if (errCode) {
        socket.write(`HTTP/1.1 ${errCode}\r\n\r\n`);
        socket.destroy();
        return;
      }
      webSocketServer.handleUpgrade(request, socket, head, (websocket) => {
        websocket.account = request.account;
        webSocketServer.emit("connection", websocket, request, head);
      });
    });
  });

  webSocketServer.addListener("connection", (websocket, request) => {
    // nhận message từ app
    websocket.on("message", (data, isBinary) => {
      const { command, electricMeterId, ...message } = JSON.parse(
        data.toString()
      );
      const { action, time, daily, ssid, pass } = message;
      switch (command) {
        case REQUEST_COMAND_SOCKET.ADD_TIMER:
          addCommand({
            websocket,
            command,
            electricMeterId,
            callback: addTimer,
            props: { websocket, electricMeterId, action, time, daily },
          });
          break;
        case REQUEST_COMAND_SOCKET.UPDATE_TIMER:
          const { timerId } = message;
          addCommand({
            websocket,
            command,
            electricMeterId,
            callback: updateTimer,
            props: {
              websocket,
              electricMeterId,
              timerId,
              action,
              time,
              daily,
            },
          });
          break;
        case REQUEST_COMAND_SOCKET.DELETE_TIMERS:
          const { timerIds } = message;
          addCommand({
            websocket,
            command,
            electricMeterId,
            callback: deleteTimers,
            props: { websocket, electricMeterId, timerIds },
          });
          break;
        case REQUEST_COMAND_SOCKET.RELAY:
          const { status } = message;
          relay({ websocket, electricMeterId, status });
          break;
        case REQUEST_COMAND_SOCKET.UPDATE_FIRMWARE:
          const { url } = message;
          updateFirmware({ websocket, electricMeterId, url });
          break;
        case REQUEST_COMAND_SOCKET.CHANGE_SERVER:
          const { ser, port } = message;
          changeServer({ websocket, electricMeterId, ser, port });
          break;
        case REQUEST_COMAND_SOCKET.RESTART:
          addCommand({
            websocket,
            command,
            electricMeterId,
            callback: restartEM,
            props: { websocket, electricMeterId },
          });
          break;
        case REQUEST_COMAND_SOCKET.SCAN_WIFI:
          addCommand({
            websocket,
            command,
            electricMeterId,
            callback: scanWifi,
            props: { websocket, electricMeterId },
          });
          break;
        case REQUEST_COMAND_SOCKET.CONNECT_WIFI:
          addCommand({
            websocket,
            command,
            electricMeterId,
            callback: connectWifi,
            props: { websocket, electricMeterId, ssid, pass },
          });
          break;
        default:
      }
    });
  });
};

const MQTTClient = () => {
  client.on("connect", () => {
    client.subscribe("SM_EL_MT/#", { qos: 1 }, () => {});
  });

  client.on("message", (topic, payload) => {
    onMessage(topic, payload);
  });
};

// gửi message lên công tơ
const publish = async ({ electricMeterId, command, data }) => {
  const message = { command, ...data };
  const topic = `SM_EL_MT/${electricMeterId}/sub`;
  const payload = JSON.stringify(message);
  if (client.connected) {
    const result = await client.publishAsync(topic, payload);
  }
};

// Nhận message từ công tơ
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
      const newtimers = await createTimers(timers);
      handleWhenReceivedTimer({ electricMeterId, timers: newtimers });
      break;
    case RESPONSE_COMAND_MQTT.RESTART:
      const { Status } = data;
      updateEm({ load: Status });
      handleWhenReceivedRestart({ electricMeterId, status: Status });
      break;
    case RESPONSE_COMAND_MQTT.SCAN_WIFI:
      const { Name } = data;
      handleWhenReceivedWifis({ electricMeterId, ssids: Name });
      break;
    case RESPONSE_COMAND_MQTT.CONNECT_WIFT:
      handleWhenReceivedWifiConnection({
        electricMeterId,
        ssid: Ssid,
        pass: Pass,
      });
    case RESPONSE_COMAND_MQTT.CHANGE_SERVER:
      const { Ser, Port } = data;
      handleWhenReceivedChangeServer({ electricMeterId, ser: Ser, port: Port });
      break;
    default:
  }
};

// Xử lý khi công tơ trả về hẹn giờ
const handleWhenReceivedTimer = async ({ electricMeterId, timers }) => {
  try {
    const websockets = [];
    const iterator1 = webSocketServer.clients.values();
    let client = iterator1.next().value;
    while (client) {
      if (Array.isArray(client.requests)) {
        const electricMeterIds = client.requests.map(
          (item) => item.electricMeterId
        );
        if (electricMeterIds.includes(electricMeterId)) {
          websockets.push(client);
        }
      }
      client = iterator1.next().value;
    }
    websockets.forEach((websocket) => {
      const arr = [];
      const indexAdd = websocket.requests.findIndex(
        (request) => request.command === REQUEST_COMAND_SOCKET.ADD_TIMER
      );
      const indexUpdate = websocket.requests.findIndex(
        (request) => request.command === REQUEST_COMAND_SOCKET.UPDATE_TIMER
      );
      const indexDelete = websocket.requests.findIndex(
        (request) => request.command === REQUEST_COMAND_SOCKET.DELETE_TIMERS
      );
      if (indexAdd > -1) {
        arr.push(indexAdd);
      }
      if (indexUpdate > -1) {
        arr.push(indexUpdate);
      }
      if (indexDelete > -1) {
        arr.push(indexDelete);
      }
      const indexMin = Math.min(...arr);
      if (indexMin === indexAdd) {
        websocket.requests.splice(indexAdd, 1);
        sendMessageFSuccessful({
          websocket,
          command: RESPONSE_COMAND_SOCKET.ADD_TIMER,
          data: { timers },
        });
        return;
      }

      if (indexMin === indexUpdate) {
        websocket.requests.splice(indexUpdate, 1);
        sendMessageFSuccessful({
          websocket,
          command: RESPONSE_COMAND_SOCKET.UPDATE_TIMER,
          data: { timers },
        });
        return;
      }

      if (indexMin === indexDelete) {
        websocket.requests.splice(indexDelete, 1);
        sendMessageFSuccessful({
          websocket,
          command: RESPONSE_COMAND_SOCKET.DELETE_TIMERS,
          data: { timers },
        });
        return;
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Xử lý khi công tơ trả về restart
const handleWhenReceivedRestart = async ({ electricMeterId, status }) => {
  try {
    const websockets = [];
    const iterator1 = webSocketServer.clients.values();
    let client = iterator1.next().value;
    while (client) {
      if (Array.isArray(client.requests)) {
        const electricMeterIds = client.requests.map(
          (item) => item.electricMeterId
        );
        if (electricMeterIds.includes(electricMeterId)) {
          websockets.push(client);
        }
      }
      client = iterator1.next().value;
    }
    websockets.forEach((websocket) => {
      const index = websocket.requests.findIndex(
        (request) => request.command === REQUEST_COMAND_SOCKET.RESTART
      );
      if (index > -1) {
        websocket.requests.splice(index, 1);
        sendMessageFSuccessful({
          websocket,
          command: RESPONSE_COMAND_SOCKET.RESTART,
          data: { status },
        });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Xử lý khi công tơ trả về danh sách wifi
const handleWhenReceivedWifis = async ({ electricMeterId, ssids }) => {
  try {
    const iterator1 = webSocketServer.clients.values();
    let client = iterator1.next().value;
    const websockets = [];
    while (client) {
      if (Array.isArray(client.requests)) {
        const electricMeterIds = client.requests.map(
          (item) => item.electricMeterId
        );
        if (electricMeterIds.includes(electricMeterId)) {
          websockets.push(client);
        }
      }
      client = iterator1.next().value;
    }
    websockets.forEach((websocket) => {
      const index = websocket.requests.findIndex(
        (request) => request.command === REQUEST_COMAND_SOCKET.SCAN_WIFI
      );
      if (index > -1) {
        websocket.requests.splice(index, 1);
        sendMessageFSuccessful({
          websocket,
          command: RESPONSE_COMAND_SOCKET.SCAN_WIFI,
          data: { ssids },
        });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Xử lý khi công tơ trả về kết nối
const handleWhenReceivedWifiConnection = async ({
  electricMeterId,
  ssid,
  pass,
}) => {
  try {
    const iterator1 = webSocketServer.clients.values();
    let client = iterator1.next().value;
    const websockets = [];
    while (client) {
      if (Array.isArray(client.requests)) {
        const electricMeterIds = client.requests.map(
          (item) => item.electricMeterId
        );
        if (electricMeterIds.includes(electricMeterId)) {
          websockets.push(client);
        }
      }
      client = iterator1.next().value;
    }
    websockets.forEach((websocket) => {
      const index = websocket.requests.findIndex(
        (request) => request.command === REQUEST_COMAND_SOCKET.CONNECT_WIFI
      );
      if (index > -1) {
        websocket.requests.splice(index, 1);
        sendMessageFSuccessful({
          websocket,
          command: RESPONSE_COMAND_SOCKET.CONNECT_WIFI,
          data: { ssid, pass },
        });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Xử lý khi công tơ nhận được sự thay đổi server
const handleWhenReceivedChangeServer = async ({
  electricMeterId,
  ser,
  port,
}) => {
  try {
    const iterator1 = webSocketServer.clients.values();
    let client = iterator1.next().value;
    const websockets = [];
    while (client) {
      if (Array.isArray(client.requests)) {
        const electricMeterIds = client.requests.map(
          (item) => item.electricMeterId
        );
        if (electricMeterIds.includes(electricMeterId)) {
          websockets.push(client);
        }
      }
      client = iterator1.next().value;
    }
    websockets.forEach((websocket) => {
      const index = websocket.requests.findIndex(
        (request) => request.command === REQUEST_COMAND_SOCKET.CHANGE_SERVER
      );
      if (index > -1) {
        websocket.requests.splice(index, 1);
        sendMessageFSuccessful({
          websocket,
          command: RESPONSE_COMAND_SOCKET.CHANGE_SERVER,
          data: { ser, port },
        });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Thêm cách yêu cầu vào một danh sách
const addCommand = async ({
  websocket,
  command,
  electricMeterId,
  callback,
  props,
}) => {
  const { accountId, level } = websocket.account;
  if (!COMMAND_SOCKET_WITH_EM_ROLE[command]) {
    sendMessageFailed({
      websocket,
      command: handleResSocketCorespondingReqSocket(command),
      reason: "Không tồn tại yêu cầu này",
    });
    return;
  }
  const em = await findAccountByEMId(electricMeterId);
  if (!em) {
    sendMessageFailed({
      websocket,
      command: handleResSocketCorespondingReqSocket(command),
      reason: "Công tơ không tồn tại",
    });
    return;
  }

  if (COMMAND_SOCKET_WITH_EM_ROLE[command].length === 0) {
    if (Array.isArray(websocket.requests)) {
      websocket.requests.push({ command, electricMeterId });
    } else {
      websocket.requests = [{ command, electricMeterId }];
    }
    callback({ ...props });
    return;
  }

  let role;
  if (level === ACCOUNT_LEVEL.admin) {
    role = EM_ROLES.admin;
  }
  if (!role && em.accountId === accountId) {
    role = EM_ROLES.owner;
  }
  if (!role) {
    const findedAccountByEMShareId = await findAccountByEMShareId(
      electricMeterId,
      accountId
    );
    if (findedAccountByEMShareId) {
      role = findedAccountByEMShareId.roleShare;
    }
  }
  if (!COMMAND_SOCKET_WITH_EM_ROLE[command].includes(role)) {
    sendMessageFailed({
      websocket,
      command: handleResSocketCorespondingReqSocket(command),
      reason: "Không đủ quyền",
    });
    return;
  }
  if (Array.isArray(websocket.requests)) {
    websocket.requests.push({ command, electricMeterId });
  } else {
    websocket.requests = [{ command, electricMeterId }];
  }
  callback({ ...props });
  return;
};

// Thêm lịch trình
const addTimer = async ({
  websocket,
  electricMeterId,
  action,
  time,
  daily,
}) => {
  try {
    const result = createTimerDTO.validate({ action, time, daily });
    if (result.error) {
      sendMessageFailed({
        websocket,
        command: RESPONSE_COMAND_SOCKET.ADD_TIMER,
        reason: "Thiếu tham số",
      });
      return;
    }

    const allTimers = await getTimersByEMId({ electricMeterId });
    const timeOn = [];
    const timeOff = [];
    const dailyOn = [];
    const dailyOff = [];
    allTimers.forEach((timer) => {
      if (timer.actionId === TIMER_ACTION_ID.on) {
        timeOn.push(timer.time);
        dailyOn.push(timer.daily);
      } else if (timer.actionId === TIMER_ACTION_ID.off) {
        timeOff.push(timer.time);
        dailyOff.push(timer.daily);
      }
    });
    if (action === TIMER_ACTION.on) {
      timeOn.push(time);
      dailyOn.push(daily);
    } else {
      timeOff.push(time);
      dailyOff.push(daily);
    }
    await publish({
      electricMeterId,
      command: REQUEST_COMAND_MQTT.TIMER,
      data: {
        Timeon: timeOn,
        Dailyon: dailyOn,
        Timeoff: timeOff,
        Dailyoff: dailyOff,
      },
    });
    return;
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.ADD_TIMER,
      reason: "Thiếu tham số",
    });
    return;
  }
};

// Cập nhật lịch trình
const updateTimer = async ({
  websocket,
  electricMeterId,
  timerId,
  action,
  time,
  daily,
}) => {
  try {
    const findedTimer = await findedTimerById(timerId);
    if (!findedTimer) {
      sendMessageFailed({
        websocket,
        command: RESPONSE_COMAND_SOCKET.UPDATE_TIMER,
        reason: "Không tìm thấy lịch trình",
      });
      return;
    }

    const result = updateTimerDTO.validate({ action, time, daily });
    if (result.error) {
      sendMessageFailed({
        websocket,
        command: RESPONSE_COMAND_SOCKET.UPDATE_TIMER,
        reason: "Thiếu tham số",
      });
      return;
    }

    const newTimer = {
      timerId,
      actionId: action ? TIMER_ACTION_ID[action] : findedTimer.actionId,
      time: time ? time : findedTimer.time,
      daily: daily ? daily : findedTimer.daily,
    };

    const timers = await getTimersByEMId({ electricMeterId });
    const index = timers.findIndex((timer) => timer.timerId === timerId);
    timers[index] = newTimer;
    const timeOn = [];
    const timeOff = [];
    const dailyOn = [];
    const dailyOff = [];
    timers.forEach((timer) => {
      if (timer.actionId === TIMER_ACTION_ID.on) {
        timeOn.push(timer.time);
        dailyOn.push(timer.daily);
      } else if (timer.actionId === TIMER_ACTION_ID.off) {
        timeOff.push(timer.time);
        dailyOff.push(timer.daily);
      }
    });
    await publish({
      electricMeterId,
      command: REQUEST_COMAND_MQTT.TIMER,
      data: {
        Timeon: timeOn,
        Dailyon: dailyOn,
        Timeoff: timeOff,
        Dailyoff: dailyOff,
      },
    });
    return;
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.UPDATE_TIMER,
      reason: "Xảy ra lỗi",
    });
    return;
  }
};

// Bật tắt công tơ
const relay = async ({ websocket, electricMeterId, status }) => {
  try {
    if (status !== 0 && status !== 1) {
      sendMessageFailed({
        websocket,
        command: RESPONSE_COMAND_SOCKET.RELAY,
        reason: "Thiếu tham số",
      });
      return;
    }
    await publish({
      electricMeterId,
      command: REQUEST_COMAND_MQTT.CONTROL,
      data: { Status: status },
    });
    sendMessageFSuccessful({
      websocket,
      command: REQUEST_COMAND_SOCKET.RELAY,
      data: { status },
    });
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.RELAY,
      reason: "Có lỗi xảy ra ",
    });
    return;
  }
};

// cập nhật firmware
const updateFirmware = async ({ websocket, electricMeterId, url }) => {
  try {
    if (!url) {
      sendMessageFailed({
        websocket,
        command: RESPONSE_COMAND_SOCKET.UPDATE_FIRMWARE,
        reason: "Thiếu tham số",
      });
      return;
    }
    await publish({
      electricMeterId,
      command: REQUEST_COMAND_MQTT.UPDATE_FIRMWARE,
      data: { Url: url },
    });
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.UPDATE_FIRMWARE,
      reason: "Có lỗi xảy ra ",
    });
    return;
  }
};

// Thay đổi server
const changeServer = async ({ websocket, electricMeterId, ser, port }) => {
  try {
    if (!ser || !port) {
      sendMessageFailed({
        websocket,
        command: RESPONSE_COMAND_SOCKET.CHANGE_SERVER,
        reason: "Thiếu tham số",
      });
      return;
    }
    await publish({
      electricMeterId,
      command: REQUEST_COMAND_MQTT.CHANGE_SERVER,
      data: { Ser: ser, Port: port },
    });
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.CHANGE_SERVER,
      reason: "Có lỗi xảy ra ",
    });
    return;
  }
};

//Khởi động lại công tơ
const restartEM = async ({ websocket, electricMeterId }) => {
  try {
    await publish({
      electricMeterId,
      command: REQUEST_COMAND_MQTT.RESTART,
    });
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.RESTART,
      reason: "Có lỗi xảy ra ",
    });
    return;
  }
};

// scan wifi
const scanWifi = async ({ websocket, electricMeterId }) => {
  try {
    await publish({ electricMeterId, command: REQUEST_COMAND_MQTT.SCAN_WIFI });
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.RESTART,
      reason: "Có lỗi xảy ra ",
    });
    return;
  }
};

// Kết nối wifi
const connectWifi = async ({ websocket, electricMeterId, ssid, pass }) => {
  try {
    await publish({
      electricMeterId,
      command: REQUEST_COMAND_MQTT.CONNECT_WIFT,
      data: { Ssid: ssid, Pass: pass },
    });
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.RESTART,
      reason: "Có lỗi xảy ra ",
    });
    return;
  }
};

// Xóa lịch trình
const deleteTimers = async ({ websocket, electricMeterId, timerIds }) => {
  try {
    if (!timerIds || !Array.isArray(timerIds)) {
      sendMessageFailed({
        websocket,
        command: RESPONSE_COMAND_SOCKET.DELETE_TIMER,
        reason: "Thiếu tham số",
      });
      return;
    }

    const isTimerIds = timerIds.every((timerId) => {
      const result = deleteTimersDTO.validate({ timerId });
      return !result.error;
    });
    if (!isTimerIds) {
      sendMessageFailed({
        websocket,
        command: RESPONSE_COMAND_SOCKET.DELETE_TIMER,
        reason: "Thiếu tham số",
      });
      return;
    }
    const allTimers = await getTimersByEMId({ electricMeterId });
    const newTimers = allTimers.filter((timer) => {
      const { timerId } = timer;
      return !timerIds.includes(timerId);
    });
    const timeOn = [];
    const timeOff = [];
    const dailyOn = [];
    const dailyOff = [];
    newTimers.forEach((timer) => {
      if (timer.actionId === TIMER_ACTION_ID.on) {
        timeOn.push(timer.time);
        dailyOn.push(timer.daily);
      } else if (timer.actionId === TIMER_ACTION_ID.off) {
        timeOff.push(timer.time);
        dailyOff.push(timer.daily);
      }
    });
    await publish({
      electricMeterId,
      command: REQUEST_COMAND_MQTT.TIMER,
      data: {
        Timeon: timeOn,
        Dailyon: dailyOn,
        Timeoff: timeOff,
        Dailyoff: dailyOff,
      },
    });
  } catch (error) {
    sendMessageFailed({
      websocket,
      command: RESPONSE_COMAND_SOCKET.DELETE_TIMER,
      reason: "Thiếu tham số",
    });
    return;
  }
};

const authUpgrade = async (request, next) => {
  const authorization = request.headers.authorization;
  if (!authorization) {
    next(ResponseStatus.UNAUTHORIZED);
  }

  const authrizationKey = authorization.split(" ")[0];
  const token = authorization.split(" ")[1];
  if (!authrizationKey || !token || authrizationKey != "Bearer") {
    next(ResponseStatus.UNAUTHORIZED);
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_KEY);
    const accessToken = await Token.findOne({
      where: { accountId: decode.accountId },
    });
    if (!accessToken) {
      next(ResponseStatus.UNAUTHORIZED);
    }
    request.account = decode;
    next();
  } catch (error) {
    next(ResponseStatus.UNAUTHORIZED);
  }
};

const sendMessageFailed = ({ websocket, command, reason }) => {
  if (websocket.readyState === OPEN) {
    const message = JSON.stringify({
      result: RESPONSE_RESULT.FAILED,
      command,
      reason,
    });
    websocket.send(message);
  }
};

const sendMessageFSuccessful = ({ websocket, command, data }) => {
  if (websocket.readyState === OPEN) {
    const message = JSON.stringify({
      result: RESPONSE_RESULT.SUCCESS,
      command,
      ...data,
    });
    websocket.send(message);
  }
};

module.exports = { MQTTClient, socketService };
