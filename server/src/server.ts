import "dotenv/config";
import express from "express";
import healthRoutes from "./routes/health.routes.js";
import { connectDatabase } from "./config/database.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/health", healthRoutes);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();