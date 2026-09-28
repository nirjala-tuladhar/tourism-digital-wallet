import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes.js";
import { connectDatabase } from "./config/database.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.use("/api/health", healthRoutes);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

app.use("/api/health", healthRoutes);

app.use(errorMiddleware);

startServer();