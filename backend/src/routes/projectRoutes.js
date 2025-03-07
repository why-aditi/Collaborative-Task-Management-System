const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const projectController = require("../controllers/projectController");
const { auth } = require("../middleware/auth");

// Validation middleware
const validateProject = [
  body("name").trim().notEmpty().withMessage("Project name is required"),
  body("description").optional().trim(),
  body("members").optional().isArray(),
  body("members.*.userId")
    .optional()
    .isMongoId()
    .withMessage("Invalid user ID"),
  body("members.*.role")
    .optional()
    .isIn(["Manager", "Member"])
    .withMessage("Invalid role"),
];

const validateMember = [
  body("userId").isMongoId().withMessage("Invalid user ID"),
  body("role")
    .optional()
    .isIn(["Manager", "Member"])
    .withMessage("Invalid role"),
];

// All routes require authentication
router.use(auth);

// Project routes
router.post("/", validateProject, projectController.createProject);
router.get("/", projectController.getProjects);
router.get("/:projectId", projectController.getProject);
router.patch("/:projectId", validateProject, projectController.updateProject);
router.delete("/:projectId", projectController.deleteProject);

// Project member routes
router.post("/:projectId/members", validateMember, projectController.addMember);
router.delete("/:projectId/members/:userId", projectController.removeMember);

// Project statistics
router.get("/:projectId/stats", projectController.getProjectStats);

// Generate project report
router.post("/:projectId/report", projectController.generateReport);

module.exports = router;
