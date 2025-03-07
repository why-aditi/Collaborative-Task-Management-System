const Task = require("../models/Task");
const Project = require("../models/Project");
const fs = require("fs");
const path = require("path");

// Create new task
exports.createTask = async (req, res) => {
  try {
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

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    res.status(400).json({ message: error.message });
  }
};

// Get tasks assigned to user
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate("project", "name")
      .populate("reporter", "name email")
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    // Log the request details
    console.log("File upload request received:", {
      taskId: req.params.taskId,
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
          }
        : "No file",
      userId: req.user._id,
    });

    // Validate request
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find and validate task
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      // Clean up uploaded file if task not found
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      return res.status(404).json({ message: "Task not found" });
    }

    // Check project access
    const project = await Project.findById(task.project);
    if (!project) {
      // Clean up uploaded file if project not found
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      // Clean up uploaded file if access denied
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      return res.status(403).json({ message: "Access denied" });
    }

    // Create attachment object
    const attachment = {
      filename: req.file.originalname,
      path: path.basename(req.file.path), // Only store the filename
      url: path.basename(req.file.path), // Store just the filename without any slashes
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    // Add attachment to task
    task.attachments.push(attachment);
    await task.save();

    console.log("Attachment saved successfully:", {
      taskId: task._id,
      filename: attachment.filename,
      path: attachment.path,
      url: attachment.url,
    });

    // Return updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("attachments.uploadedBy", "name email");

    res.json(updatedTask);
  } catch (error) {
    console.error("Error in addAttachment:", error);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    res.status(500).json({
      message: "Failed to upload file",
      error: error.message,
    });
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
