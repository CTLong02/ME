const { ROLE_EM } = require("./constant_model");
const { URL_EM } = require("./urls");
const { REQUEST_COMAND_SOCKET } = require("./command");
RESPONSE_RESULT = {
  SUCCESS: "success",
  FAILED: "failed",
};

EM_ROLES = {
  admin: "admin",
  owner: "owner",
  read_only: ROLE_EM.read_only,
  enable_control: ROLE_EM.enable_control,
};
const API_WITH_EM_ROLE = {};
API_WITH_EM_ROLE[URL_EM.shareEm] = [EM_ROLES.owner];
API_WITH_EM_ROLE[URL_EM.detailEm] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
  EM_ROLES.admin,
];

API_WITH_EM_ROLE[URL_EM.viewReportByDay] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
  EM_ROLES.admin,
];
API_WITH_EM_ROLE[URL_EM.viewReportByMonth] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
  EM_ROLES.admin,
];
API_WITH_EM_ROLE[URL_EM.viewReportByYear] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
  EM_ROLES.admin,
];

API_WITH_EM_ROLE[URL_EM.getAllTimers] = [EM_ROLES.owner, EM_ROLES.admin];
API_WITH_EM_ROLE[URL_EM.renameEm] = [EM_ROLES.owner, EM_ROLES.admin];
API_WITH_EM_ROLE[URL_EM.moveToRoom] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
];
API_WITH_EM_ROLE[URL_EM.sharedList] = [EM_ROLES.owner];
API_WITH_EM_ROLE[URL_EM.deleteShareAccount] = [EM_ROLES.owner];
API_WITH_EM_ROLE[URL_EM.addEMForAnAccount] = [EM_ROLES.admin];
API_WITH_EM_ROLE[URL_EM.getAllNewscast] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
];
API_WITH_EM_ROLE[URL_EM.createData] = [EM_ROLES.owner];

const COMMAND_SOCKET_WITH_EM_ROLE = {};

COMMAND_SOCKET_WITH_EM_ROLE[REQUEST_COMAND_SOCKET.ADD_TIMER] = [
  EM_ROLES.owner,
  EM_ROLES.admin,
];

COMMAND_SOCKET_WITH_EM_ROLE[REQUEST_COMAND_SOCKET.UPDATE_TIMER] = [
  EM_ROLES.owner,
  EM_ROLES.admin,
];

COMMAND_SOCKET_WITH_EM_ROLE[REQUEST_COMAND_SOCKET.DELETE_TIMERS] = [
  EM_ROLES.owner,
  EM_ROLES.admin,
];

COMMAND_SOCKET_WITH_EM_ROLE[REQUEST_COMAND_SOCKET.RELAY] = [
  EM_ROLES.owner,
  EM_ROLES.admin,
];

COMMAND_SOCKET_WITH_EM_ROLE[REQUEST_COMAND_SOCKET.RESTART] = [
  EM_ROLES.owner,
  EM_ROLES.admin,
];

COMMAND_SOCKET_WITH_EM_ROLE[REQUEST_COMAND_SOCKET.SCAN_WIFI] = [];
COMMAND_SOCKET_WITH_EM_ROLE[REQUEST_COMAND_SOCKET.CONNECT_WIFI] = [];

module.exports = {
  API_WITH_EM_ROLE,
  RESPONSE_RESULT,
  EM_ROLES,
  COMMAND_SOCKET_WITH_EM_ROLE,
};
