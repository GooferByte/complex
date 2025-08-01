const keys = require("./keys");

// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error("Postgres error:", err));
});

// Redis Client Setup
const redis = require("redis");
const redisClient = redis.createClient({
  url: `redis://${keys.redisHost}:${keys.redisPort}`,
});
const redisPublisher = redisClient.duplicate();

(async () => {
  try {
    await redisClient.connect();
    await redisPublisher.connect();
  } catch (err) {
    console.error("Redis connection error:", err);
  }
})();

// Express route handlers
app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  try {
    const values = await pgClient.query("SELECT * from values");
    res.send(values.rows);
  } catch (err) {
    res.status(500).send("Error fetching from Postgres");
  }
});

app.get("/values/current", async (req, res) => {
  try {
    const values = await redisClient.hGetAll("values");
    res.send(values);
  } catch (err) {
    res.status(500).send("Error fetching from Redis");
  }
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  try {
    await redisClient.hSet("values", index, "Nothing yet!");
    await redisPublisher.publish("insert", index);
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
    res.send({ working: true });
  } catch (err) {
    res.status(500).send("Error saving value");
  }
});

app.listen(5000, (err) => {
  if (err) console.error("Server error:", err);
  else console.log("Listening on port 5000");
});
