const { ROLE_EM } = require("./constant_model");
const { URL_EM } = require("./urls");
RESPONSE_RESULT = {
  SUCCESS: "success",
  FAILED: "failed",
};

EM_ROLES = {
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
];
API_WITH_EM_ROLE[URL_EM.viewReportByDay] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
];
API_WITH_EM_ROLE[URL_EM.viewReportByMonth] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
];
API_WITH_EM_ROLE[URL_EM.viewReportByYear] = [
  EM_ROLES.read_only,
  EM_ROLES.enable_control,
  EM_ROLES.owner,
];
module.exports = { API_WITH_EM_ROLE, RESPONSE_RESULT, EM_ROLES };
