const Task = require("../models/Task");
const Project = require("../models/Project");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Grid = require("gridfs-stream");

// Initialize GridFS
let gfs;
mongoose.connection.once("open", () => {
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection("uploads");
});

// Create new task
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      projectId,
      assigneeId,
      dueDate,
      priority,
      estimatedHours,
    } = req.body;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      assignee: assigneeId,
      reporter: req.user._id,
      dueDate,
      priority,
      estimatedHours,
    });

    await task.save();

    // Add task to project's tasks array
    project.tasks.push(task._id);
    await project.save();

    const populatedTask = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("project", "name");

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res
      .status(500)
      .json({ message: "Error creating task", error: error.message });
  }
};

// Get tasks for a project
exports.getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
};

// Get tasks for the current user
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [{ assignee: req.user._id }, { reporter: req.user._id }],
    })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("project", "name")
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("comments.author", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    console.log("Update task request:", {
      taskId: req.params.taskId,
      updates: req.body,
      user: req.user._id,
    });

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      console.log("Task not found:", req.params.taskId);
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project) {
      console.log("Project not found for task:", task.project);
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      console.log("Access denied for user:", req.user._id);
      return res.status(403).json({ message: "Access denied" });
    }

    // Handle status update specifically
    if (req.body.status !== undefined) {
      console.log("Processing status update:", req.body.status);

      if (!["To-Do", "In Progress", "Completed"].includes(req.body.status)) {
        return res.status(400).json({
          message: "Invalid status value",
          allowedValues: ["To-Do", "In Progress", "Completed"],
        });
      }
      task.status = req.body.status;
      console.log("Status updated to:", task.status);
    }

    // Handle other updates
    const updates = Object.keys(req.body).filter((key) => key !== "status");
    const allowedUpdates = [
      "title",
      "description",
      "priority",
      "dueDate",
      "assignee",
      "estimatedHours",
      "actualHours",
    ];

    const invalidUpdates = updates.filter(
      (update) => !allowedUpdates.includes(update)
    );
    if (invalidUpdates.length > 0) {
      console.log("Invalid update fields:", invalidUpdates);
      return res.status(400).json({
        message: "Invalid update fields",
        invalidFields: invalidUpdates,
        allowedFields: allowedUpdates,
      });
    }

    updates.forEach((update) => {
      task[update] = req.body[update];
    });

    try {
      await task.save();
      console.log("Task updated successfully:", task._id);

      // Return populated task
      const updatedTask = await Task.findById(task._id)
        .populate("assignee", "name email")
        .populate("reporter", "name email")
        .populate("project", "name");

      res.json(updatedTask);
    } catch (saveError) {
      console.error("Error saving task:", saveError);
      throw new Error(`Failed to save task: ${saveError.message}`);
    }
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    task.comments.push({
      content,
      author: req.user._id,
    });

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add attachment to task
exports.addAttachment = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has permission to add attachments
    if (
      !task.assignee.equals(req.user._id) &&
      !task.reporter.equals(req.user._id)
    ) {
      return res.status(403).json({ message: "Permission denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const attachment = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      fileId: req.file.id,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    task.attachments.push(attachment);
    await task.save();

    res.status(201).json(attachment);
  } catch (error) {
    console.error("Error adding attachment:", error);
    res
      .status(500)
      .json({ message: "Error adding attachment", error: error.message });
  }
};

// Get all attachments for a task
exports.getAttachments = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = await Task.findById(taskId).populate(
      "attachments.uploadedBy",
      "name email"
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task.attachments);
  } catch (error) {
    console.error("Error getting attachments:", error);
    res
      .status(500)
      .json({ message: "Error getting attachments", error: error.message });
  }
};

// Download an attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const attachmentId = req.params.attachmentId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Find the file in GridFS
    const file = await gfs.files.findOne({ _id: attachment.fileId });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Set headers
    res.set("Content-Type", file.contentType);
    res.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.originalname)}"`
    );

    // Stream the file
    const readstream = gfs.createReadStream(file._id);
    readstream.pipe(res);
  } catch (error) {
    console.error("Error downloading attachment:", error);
    res
      .status(500)
      .json({ message: "Error downloading attachment", error: error.message });
  }
};

// Delete an attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const attachmentId = req.params.attachmentId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Check if user has permission to delete attachment
    if (
      !task.assignee.equals(req.user._id) &&
      !task.reporter.equals(req.user._id) &&
      !attachment.uploadedBy.equals(req.user._id)
    ) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Remove file from GridFS
    await gfs.remove({ _id: attachment.fileId, root: "uploads" });

    // Remove attachment from task
    task.attachments.pull(attachmentId);
    await task.save();

    res.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res
      .status(500)
      .json({ message: "Error deleting attachment", error: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (
      !project.isManager(req.user._id) &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Remove task from project's tasks array
    project.tasks = project.tasks.filter(
      (taskId) => taskId.toString() !== task._id.toString()
    );
    await project.save();

    // Delete the task using deleteOne
    await Task.deleteOne({ _id: task._id });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tasks = await Task.find({ project: req.params.projectId });

    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((task) => task.status === "Completed")
        .length,
      inProgressTasks: tasks.filter((task) => task.status === "In Progress")
        .length,
      todoTasks: tasks.filter((task) => task.status === "To-Do").length,
      highPriorityTasks: tasks.filter((task) => task.priority === "High")
        .length,
      mediumPriorityTasks: tasks.filter((task) => task.priority === "Medium")
        .length,
      lowPriorityTasks: tasks.filter((task) => task.priority === "Low").length,
      overdueTasks: tasks.filter((task) => task.isOverdue()).length,
      totalEstimatedHours: tasks.reduce(
        (sum, task) => sum + (task.estimatedHours || 0),
        0
      ),
      totalActualHours: tasks.reduce(
        (sum, task) => sum + (task.actualHours || 0),
        0
      ),
    };

    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
