import "dotenv/config";
import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import router from "./routes/index.route";
import { ENV } from "./config/env.config";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.config";

const app: Application = express();
const PORT = ENV.PORT || 3000;

app.set("trust proxy", 1);
app.use(
  cors({
    origin: ENV.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (ENV.NODE_ENV === "development") app.use(morgan("dev"));

app.use(router);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(
        `Server is running in ${ENV.NODE_ENV} mode on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1); // Exit the process with an error code
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection at:", reason);
});

startServer();
