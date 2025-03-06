const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const userController = require("../controllers/userController");
const { auth, checkRole } = require("../middleware/auth");

// Validation middleware
const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["Admin", "Manager", "Member"])
    .withMessage("Invalid role"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Public routes
router.post("/register", validateRegister, userController.register);
router.post("/login", validateLogin, userController.login);

// Protected routes
router.get("/profile", auth, userController.getProfile);
router.patch("/profile", auth, userController.updateProfile);

// Admin only routes
router.get("/users", auth, checkRole("Admin"), userController.getAllUsers);
router.patch(
  "/users/:userId/role",
  auth,
  checkRole("Admin"),
  userController.updateUserRole
);
router.delete(
  "/users/:userId",
  auth,
  checkRole("Admin"),
  userController.deleteUser
);

module.exports = router;
