const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body } = require("express-validator");
const taskController = require("../controllers/taskController");
const { auth } = require("../middleware/auth");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const safeName = `${uniqueSuffix}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, PDFs, Word documents and text files are allowed."
        ),
        false
      );
    }
  },
});

// Validation middleware
const validateTask = [
  body("title").trim().notEmpty().withMessage("Task title is required"),
  body("description").optional().trim(),
  body("projectId").isMongoId().withMessage("Invalid project ID"),
  body("assigneeId").isMongoId().withMessage("Invalid assignee ID"),
  body("dueDate").isISO8601().withMessage("Invalid due date"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Invalid priority"),
  body("estimatedHours")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid estimated hours"),
];

const validateTaskStatus = [
  body("status")
    .isIn(["To-Do", "In Progress", "Completed"])
    .withMessage("Invalid task status"),
];

const validateComment = [
  body("content").trim().notEmpty().withMessage("Comment content is required"),
];

// All routes require authentication
router.use(auth);

// Task routes
router.post("/", validateTask, taskController.createTask);
router.get("/project/:projectId", taskController.getProjectTasks);
router.get("/user", taskController.getUserTasks);
router.get("/:taskId", taskController.getTask);
router.patch("/:taskId", validateTask, taskController.updateTask);
router.patch("/:taskId/status", validateTaskStatus, taskController.updateTask);
router.delete("/:taskId", taskController.deleteTask);

// Task comments
router.post("/:taskId/comments", validateComment, taskController.addComment);

// Task attachments
router.post(
  "/:taskId/attachments",
  auth,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "File too large",
            details: "File size cannot exceed 5MB",
          });
        }
        return res.status(400).json({
          message: "File upload error",
          details: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          message: "File upload error",
          details: err.message,
        });
      }
      next();
    });
  },
  taskController.addAttachment
);

// Task statistics
router.get("/project/:projectId/stats", taskController.getTaskStats);

module.exports = router;
