require("dotenv").config();

const config = {
  mongoURI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/task-management",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || "development",
  // GridFS settings
  gridfs: {
    bucketName: "uploads",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ],
  },
};

module.exports = config;
