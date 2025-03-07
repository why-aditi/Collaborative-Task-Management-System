const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { auth } = require("../middleware/auth");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
router.get("/:filename", auth, (req, res) => {
  try {
    // Clean and validate filename
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);

    console.log("Attempting to serve file:", {
      requestedFile: req.params.filename,
      cleanFilename: filename,
      fullPath: filePath,
    });

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).json({ message: "File not found" });
    }

    // Set appropriate headers
    const mimeType =
      {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
      }[path.extname(filename).toLowerCase()] || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (error) => {
      console.error(`Error streaming file: ${error}`);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error streaming file" });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving file:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

module.exports = router;
