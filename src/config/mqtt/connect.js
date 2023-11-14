const mqtt = require("mqtt");
const brokerUrl = `${process.env.BROKER_PROTOCOL}://${process.env.BROKER_SERVE}:${process.env.BROKER_PORT}`;
const client = mqtt.connect(brokerUrl, {
  clientId: process.env.BROKER_CLIENT_ID,
  username: process.env.BROKER_USERNAME,
  password: process.env.BROKER_PASSWORD,
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 2000,
  keepalive: 100,
});

module.exports = client;
