const express = require("express");
const { createClient } = require("redis");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOTAL_SEATS = 100;

/* Redis connection (Render + Upstash) */
const client = createClient({
  url: process.env.REDIS_URL
});

/* Redis error handling */
client.on("error", (err) => console.log("Redis Error:", err));

/* Connect to Redis */
(async () => {
  try {
    await client.connect();
    console.log("Connected to Redis");

    const exists = await client.exists("seats");

    if (!exists) {
      await client.set("seats", TOTAL_SEATS);
      console.log("Seats initialized to 100");
    }

  } catch (error) {
    console.log("Redis connection failed:", error);
  }
})();

/* Booking API */
app.post("/book", async (req, res) => {
  try {
    let remaining = await client.decr("seats");

    if (remaining < 0) {
      await client.incr("seats");

      return res.json({
        success: false,
        message: "No seats available"
      });
    }

    res.json({
      success: true,
      bookingId: uuidv4(),
      remainingSeats: remaining
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Booking failed",
      error: error.message
    });
  }
});

/* Status API */
app.get("/status", async (req, res) => {
  try {
    let seats = await client.get("seats");

    res.json({
      remainingSeats: seats
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/* Start server */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
