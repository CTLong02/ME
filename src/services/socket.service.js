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

const { schemaTimer, handleAction } = require("../utils/helper/AppHelper");

const { findTimer, getTimersByEMId } = require("../services/Timer.service");
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
      const { command, ...message } = JSON.parse(data.toString());
      switch (command) {
        case REQUEST_COMAND_SOCKET.ADD_TIMER:
          const { electricMeterId, action, time, daily } = message;
          addTimer({ websocket, electricMeterId, action, time, daily });
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
    const result = schemaTimer.validate({ action, time, daily });
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
    publish({
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
const updateTimer = async (req, res) => {
  try {
    const { electricMeterId } = req.em;
    const { action, time, daily } = req.query;
    const iTime = toInt(time);
    const iDaily = toInt(daily);
    const newAcion = req.body.action;
    const newTime = req.body.time;
    const newDaily = req.body.daily;
    if (
      (newAcion && !Object.values(TIMER_ACTION).includes(action)) ||
      (newTime &&
        (!Number.isInteger(newTime) ||
          newTime < 0 ||
          newTime > TIME.Time_MAX_ON_DAY)) ||
      (newDaily &&
        (!Number.isInteger(newDaily) || newDaily < 0 || newDaily > 128))
    ) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Sai tham số");
    }

    const findedTimer = await findTimer({
      electricMeterId,
      actionId: TIMER_ACTION_ID[action],
      time,
      daily,
    });
    if (!findedTimer) {
      return responseFailed(
        res,
        ResponseStatus.NOT_FOUND,
        "Không tìm thấy lịch trình"
      );
    }

    const newTimer = {
      timerId: findedTimer.dataValues.timerId,
      actionId: newAcion ? TIMER_ACTION_ID[newAcion] : TIMER_ACTION_ID[action],
      time: newTime ? newTime : iTime,
      daily: newDaily ? newDaily : iDaily,
    };

    const findedNewTimer = await findTimer({ electricMeterId, ...newTimer });
    if (findedNewTimer) {
      return responseFailed(
        res,
        ResponseStatus.BAD_REQUEST,
        "Lịch trình này đã tồn tại"
      );
    }

    const timers = await getTimersByEMId({ electricMeterId });
    const index = timers.findIndex(
      (timer) => timer.timerId === findedTimer.dataValues.timerId
    );
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
    const timer = { action: handleAction(newTimer.actionId), ...newTimer };
    delete timer.actionId;
    delete timer.timerId;
    return responseSuccess(res, ResponseStatus.SUCCESS, {
      timer,
    });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_GATEWAY, "Xảy ra lỗi");
  }
};

// Xóa lịch trình
const deleteTimer = async (req, res) => {
  try {
    const { electricMeterId } = req.em;
    const { timers } = req.body;
    if (!timers || !Array.isArray(timers)) {
      return responseFailed(res, ResponseStatus.BAD_REQUEST, "Thiếu tham số");
    }
    const handledTimers = timers.map((timer) => {
      const { action, time, daily } = timer;
      return { actionId: TIMER_ACTION_ID[action], time, daily };
    });
    const allTimers = await getTimersByEMId({ electricMeterId });
    const newTimers = allTimers.filter((timer) => {
      const { actionId, time, daily } = timer;
      const json = JSON.stringify({ actionId, time, daily });
      return !JSON.stringify(handledTimers).includes(json);
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
    return responseSuccess(res, ResponseStatus.SUCCESS, { timers });
  } catch (error) {
    return responseFailed(res, ResponseStatus.BAD_GATEWAY, "Xảy ra lỗi");
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
