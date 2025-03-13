require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const morgan = require("morgan");

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Log the environment variables for debugging (remove in production)
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Request origin:", origin); // Debug: Log incoming request origin

      // Check if FRONTEND_URL is properly defined
      if (!process.env.FRONTEND_URL) {
        console.error("FRONTEND_URL environment variable is not defined!");
        return callback(null, true); // Allow all origins if env var is missing (not secure for production)
      }

      const allowedOrigins = process.env.FRONTEND_URL.split(",").map((url) =>
        url.trim()
      );
      console.log("Allowed origins:", allowedOrigins); // Debug: Log allowed origins

      if (!origin) {
        // Allow requests with no origin (like mobile apps, postman, etc.)
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error(
          `Origin ${origin} not allowed by CORS policy. Allowed origins: ${allowedOrigins.join(
            ", "
          )}`
        );
        return callback(
          new Error(`Origin ${origin} not allowed by CORS`),
          false
        );
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Add OPTIONS handler for all routes to respond properly to preflight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // Add logging

// Add error logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`Response for ${req.method} ${req.url}:`, data);
    originalSend.call(this, data);
  };
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

module.exports = app;
