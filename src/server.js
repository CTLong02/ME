const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// router
const route = require("./routes");
route(app);

//connect db
const { createTable } = require("./config/database/connect");
createTable();

//mqtt
const { onMessage } = require("./services/mqtt.service");
const client = require("./config/mqtt/connect");
client.on("connect", () => {
  client.subscribe("SM_EL_MT/#", () => {});
});

client.on("message", (topic, payload) => {
  onMessage(topic, payload);
});

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(process.env.PORT, () => {
  console.log(`SERVER STARTED ${process.env.PORT}`);
});
