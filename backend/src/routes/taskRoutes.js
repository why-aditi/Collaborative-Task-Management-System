const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body } = require("express-validator");
const taskController = require("../controllers/taskController");
const { auth } = require("../middleware/auth");
const storage = require("../config/gridfs");

// Configure multer with GridFS storage
const upload = multer({ storage });

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
  upload.single("file"),
  taskController.addAttachment
);
router.get("/:taskId/attachments", taskController.getAttachments);
router.get(
  "/:taskId/attachments/:attachmentId",
  taskController.downloadAttachment
);
router.delete(
  "/:taskId/attachments/:attachmentId",
  taskController.deleteAttachment
);

// Task statistics
router.get("/project/:projectId/stats", taskController.getTaskStats);

module.exports = router;
