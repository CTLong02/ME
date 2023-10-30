const AccountRouter = require("./AccountRouter");
const ElectricMeterRouter = require("./ElectricMeterRouter");
const HomeRouter = require("./HomeRouter");
const RoomRouter = require("./RoomRouter");
function route(app) {
  app.use("/api/v1/account", AccountRouter);
  app.use("/api/v1/em", ElectricMeterRouter);
  app.use("/api/v1/home", HomeRouter);
  app.use("/api/v1/room", RoomRouter);
}
module.exports = route;
