const AccountRouter = require("./AccountRouter");
function route(app) {
  app.use("/api/v1/account", AccountRouter);
}
module.exports = route;
