import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./configs/db.js";
import { SchedulerService } from "./services/scheduler.service.js";

const PORT = process.env.PORT ?? 5000;
const URI = process.env.MONGO_URI;
async function start() {
  try {
    await connectDB(URI);

    SchedulerService.start();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  SchedulerService.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  SchedulerService.stop();
  process.exit(0);
});
