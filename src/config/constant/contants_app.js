const { ROLE_EM } = require("./constant_model");
module.exports.RESPONSE_RESULT = {
  SUCCESS: "success",
  FAILED: "failed",
};

const emRole = {
  owner: "owner",
  read_only: ROLE_EM.read_only,
  enable_control: ROLE_EM.enable_control,
};
module.exports.API_WITH_EM_ROLE = {
  "em/share": [emRole.owner],
};
