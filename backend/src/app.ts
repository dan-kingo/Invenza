import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from 'url';
import { errorHandler } from "./middlewares/error.middleware.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import itemRoutes from "./routes/item.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import reportRoutes from "./routes/report.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Routes
app.use ("/", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
// Error handler (should be last)
app.use(errorHandler);

export default app;
