import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import router from "./routes";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - skal stå FØR routes
app.use(
  cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      origin: process.env.CLIENT_URL || "http://localhost:5180",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express + TS" });
});

app.use(router);

// Connect to MongoDB and start server
async function start() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

start();
