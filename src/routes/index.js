const AccountRouter = require("./AccountRouter");
const ElectricMeterRouter = require("./ElectricMeterRouter");
function route(app) {
  app.use("/api/v1/account", AccountRouter);
  app.use("/api/v1/em", ElectricMeterRouter);
}
module.exports = route;
