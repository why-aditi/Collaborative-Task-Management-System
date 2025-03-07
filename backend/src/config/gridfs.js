const mongoose = require("mongoose");
const { GridFsStorage } = require("multer-gridfs-storage");
const crypto = require("crypto");
const path = require("path");
const config = require("./config");

// Create storage engine
const storage = new GridFsStorage({
  url: config.mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // Check file type
      if (!config.gridfs.allowedMimeTypes.includes(file.mimetype)) {
        return reject(new Error("File type not allowed"));
      }

      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: config.gridfs.bucketName,
          metadata: {
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            uploadedBy: req.user._id,
            uploadedAt: new Date(),
            taskId: req.params.taskId,
          },
          limits: {
            fileSize: config.gridfs.maxFileSize,
          },
        };
        resolve(fileInfo);
      });
    });
  },
});

module.exports = storage;
