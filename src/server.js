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

//connect database
const { createTable } = require("./config/database/connect");
createTable();

//mqtt
const { MQTTClient } = require("./services/mqtt_socket.service");
MQTTClient();

app.get("/", (req, res) => {
  res.send("Hello world!");
});

const server = app.listen(process.env.PORT, () => {
  console.log(`SERVER STARTED ${process.env.PORT}`);
});

// websocket
const { socketService } = require("./services/mqtt_socket.service");
socketService(server);
