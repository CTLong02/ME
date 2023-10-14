const Newscast = require("../models/Newscast");
const ElectricMeter = require("../models/ElectricMeter");
const insertNewscast = async (data) => {
  try {
    const {
      ID,
      Conn,
      Signal,
      Strength,
      Voltage,
      Current,
      Power,
      Energy,
      Temp,
      Load,
      Update,
    } = data;
    await ElectricMeter.findOrCreate({
      where: { id: ID },
      defaults: {
        id: ID,
        ver: "1.0",
        net: "net",
        simImei: "123",
        conn: Conn,
        signal: Signal,
        strength: Strength,
        ssid: "123",
        pass: "123",
        rtc: 0,
      },
    });
    Newscast.create({
      electricMeterId: ID,
      conn: Conn.toString(),
      signal: Signal,
      strength: Strength,
      voltage: Voltage,
      current: Current,
      power: Power,
      energy: Energy,
      temp: Temp,
      load: Load,
      update: Update.toString(),
      datetime: new Date(Date.now()),
    });
  } catch (error) {}
};

module.exports = { insertNewscast };
