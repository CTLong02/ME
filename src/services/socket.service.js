const { WebSocketServer, OPEN } = require("ws");
const jwt = require("jsonwebtoken");

const Token = require("../models/Token");

const ResponseStatus = require("../config/constant/response_status");
const { RESPONSE_RESULT } = require("../config/constant/contants_app");
const TIME = require("../config/constant/constant_time");
const {
  REQUEST_COMAND_SOCKET,
  RESPONSE_COMAND_SOCKET,
  REQUEST_COMAND_MQTT,
} = require("../config/constant/command");
const {
  TIMER_ACTION_ID,
  TIMER_ACTION,
} = require("../config/constant/constant_model");

const { handleAction } = require("../utils/helper/AppHelper");
const {
  createTimerDTO,
  updateTimerDTO,
  deleteTimersDTO,
} = require("../utils/joi/timer.joi");

const {
  findTimer,
  getTimersByEMId,
  findedTimerById,
} = require("../services/Timer.service");
const { publish } = require("./mqtt.service");

const webSocketServer = new WebSocketServer({ noServer: true, path: "/ws" });
const socketService = (server) => {
  server.on("upgrade", async (request, socket, head) => {
    authUpgrade(request, (errCode, account) => {
      if (errCode) {
        socket.write(`HTTP/1.1 ${errCode}\r\n\r\n`);
        socket.destroy();
        return;
      }
    });

    webSocketServer.handleUpgrade(request, socket, head, (websocket) => {
      webSocketServer.emit("connection", websocket, request, head);
    });
  });

  webSocketServer.addListener("connection", (websocket, request) => {
    websocket.on("message", (data, isBinary) => {
      const { command, electricMeterId, ...message } = JSON.parse(
        data.toString()
      );
      const { action, time, daily } = message;
      switch (command) {
        case REQUEST_COMAND_SOCKET.ADD_TIMER:
          addTimer({ websocket, electricMeterId, action, time, daily });
          break;
        case REQUEST_COMAND_SOCKET.UPDATE_TIMER:
          const { timerId } = message;
          updateTimer({
            websocket,
            electricMeterId,
            timerId,
            action,
            time,
            daily,
          });
        case REQUEST_COMAND_SOCKET.DELETE_TIMER:
          const { timerIds } = message;
          deleteTimer({ websocket, electricMeterId, timerIds });
          break;
        default:
      }
    });
  });
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

// Xóa lịch trình
const deleteTimer = async ({ websocket, electricMeterId, timerIds }) => {
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
      command: RRESPONSE_COMAND_SOCKET.DELETE_TIMER,
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

module.exports = { socketService };
