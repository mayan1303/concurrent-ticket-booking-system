const express = require("express");
const { createClient } = require("redis");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOTAL_SEATS = 100;

const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", (err) => console.log("Redis Error:", err));

(async () => {
  await client.connect();
  console.log("Connected to Redis");

  const exists = await client.exists("seats");
  if (!exists) {
    await client.set("seats", TOTAL_SEATS);
    console.log("Seats initialized to 100");
  }
})();

app.post("/book", async (req, res) => {
  let remaining = await client.decr("seats");

  if (remaining < 0) {
    await client.incr("seats");
    return res.json({ success: false, message: "No seats available" });
  }

  res.json({
    success: true,
    bookingId: uuidv4(),
    remainingSeats: remaining
  });
});

app.get("/status", async (req, res) => {
  let seats = await client.get("seats");
  res.json({ remainingSeats: seats });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});