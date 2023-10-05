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
const { conectDB, createTable } = require("./config/database/connect");
createTable();

//mqtt
const client = require("./config/mqtt/connect");
client.on("connect", () => {
  console.log("connect mqtt");
  client.subscribe("#", () => {
    console.log("subribe");
  });
});

client.on("message", (topic, payload) => {
  console.log(
    new Date(Date.now()).toLocaleString("vn"),
    "Receive message",
    topic,
    payload.toString()
  );
});

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(process.env.PORT, () => {
  console.log(`SERVER STARTED ${process.env.PORT}`);
});
