import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

import dalleRoutes from "./routes/dalle.routes.js";
import designRoutes from "./routes/design.routes.js";
import pollinationsRoutes from "./routes/pollinations.routes.js";
import connectToDatabase from "./lib/connectToDatabase.js";

dotenv.config();

const clientEnvPath = fileURLToPath(new URL("../client/.env", import.meta.url));
if (!process.env.CLERK_PUBLISHABLE_KEY && existsSync(clientEnvPath)) {
  dotenv.config({ path: clientEnvPath, override: false });
}

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const clerkPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;

app.use(
  cors({
    origin: clientOrigin.split(",").map((origin) => origin.trim()),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(
  clerkMiddleware({
    publishableKey: clerkPublishableKey,
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

app.use("/api/v1/dalle", dalleRoutes);
app.use("/api/v1/designs", designRoutes);
app.use("/api/v1/pollinations", pollinationsRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Drip3D backend is live." });
});

connectToDatabase()
  .then(() => {
    console.log("MongoDB connected");
    app.listen(8080, () => console.log("Server has started on port 8080"));
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error?.message || error);
    process.exit(1);
  });
