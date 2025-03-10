const Project = require("../models/Project");
const Task = require("../models/Task");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    // Create the project with the owner
    const project = new Project({
      name,
      description,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "Manager",
        },
      ],
    });

    // Add additional members if provided
    if (members && members.length > 0) {
      project.members.push(
        ...members.map((member) => ({
          user: member.userId,
          role: member.role || "Member",
        }))
      );
    }

    await project.save();

    // Populate the project with user details before sending response
    const populatedProject = await Project.findById(project._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get all projects for the user
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .populate("tasks", "title status priority");

    res.json(projects);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    console.log("Fetching project with ID:", req.params.projectId);
    console.log("User requesting project:", req.user._id);

    const project = await Project.findById(req.params.projectId)
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .populate("tasks");

    if (!project) {
      console.log("Project not found");
      return res.status(404).json({ message: "Project not found" });
    }

    // Debug logging
    console.log("Project owner:", project.owner._id);
    console.log(
      "Project members:",
      project.members.map((m) => ({
        user: m.user._id,
        role: m.role,
      }))
    );
    console.log(
      "Is user owner?",
      project.owner._id.toString() === req.user._id.toString()
    );
    console.log("Is user member?", project.isMember(req.user._id));
    console.log("Is user manager?", project.isManager(req.user._id));

    // Check if user has access to the project
    if (!project.isMember(req.user._id)) {
      console.log("User does not have access to project");
      return res.status(403).json({ message: "Access denied" });
    }

    console.log("Project found and user has access");
    res.json(project);
  } catch (error) {
    console.error("Error in getProject:", error);
    res.status(400).json({ message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "description", "status", "endDate"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ message: "Invalid updates" });
  }

  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is project owner or manager
    if (
      !project.isManager(req.user._id) &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    updates.forEach((update) => (project[update] = req.body[update]));
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add member to project
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is project owner or manager
    if (
      !project.isManager(req.user._id) &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user is already a member
    if (project.isMember(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    project.members.push({ user: userId, role: role || "Member" });
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove member from project
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is project owner or manager
    if (
      !project.isManager(req.user._id) &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Cannot remove project owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: "Cannot remove project owner" });
    }

    project.members = project.members.filter(
      (member) => member.user.toString() !== userId
    );
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only project owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete all tasks associated with the project
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get project statistics
exports.getProjectStats = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access to the project
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tasks = await Task.find({ project: project._id });

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
    };

    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Generate project report
exports.generateReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .populate({
        path: "tasks",
        populate: { path: "assignee", select: "name email" },
      });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create a new PDF document
    const doc = new PDFDocument();
    const filename = `project-report-${project._id}.pdf`;

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(20).text("Project Report", { align: "center" }).moveDown();

    // Project Details
    doc
      .fontSize(16)
      .text("Project Details")
      .moveDown()
      .fontSize(12)
      .text(`Name: ${project.name}`)
      .text(`Description: ${project.description}`)
      .text(`Status: ${project.status}`)
      .text(`Start Date: ${new Date(project.startDate).toLocaleDateString()}`)
      .text(`End Date: ${new Date(project.endDate).toLocaleDateString()}`)
      .moveDown();

    // Team Members
    doc.fontSize(16).text("Team Members").moveDown().fontSize(12);

    project.members.forEach((member) => {
      doc.text(`${member.user.name} (${member.role})`);
    });
    doc.moveDown();

    // Task Statistics
    const stats = {
      total: project.tasks.length,
      completed: project.tasks.filter((task) => task.status === "Completed")
        .length,
      inProgress: project.tasks.filter((task) => task.status === "In Progress")
        .length,
      todo: project.tasks.filter((task) => task.status === "To-Do").length,
      highPriority: project.tasks.filter((task) => task.priority === "High")
        .length,
      mediumPriority: project.tasks.filter((task) => task.priority === "Medium")
        .length,
      lowPriority: project.tasks.filter((task) => task.priority === "Low")
        .length,
    };

    doc
      .fontSize(16)
      .text("Task Statistics")
      .moveDown()
      .fontSize(12)
      .text(`Total Tasks: ${stats.total}`)
      .text(`Completed: ${stats.completed}`)
      .text(`In Progress: ${stats.inProgress}`)
      .text(`To-Do: ${stats.todo}`)
      .moveDown()
      .text(`High Priority: ${stats.highPriority}`)
      .text(`Medium Priority: ${stats.mediumPriority}`)
      .text(`Low Priority: ${stats.lowPriority}`)
      .moveDown();

    // Task Details
    doc.fontSize(16).text("Task Details").moveDown();

    project.tasks.forEach((task) => {
      doc
        .fontSize(14)
        .text(task.title)
        .fontSize(12)
        .text(`Status: ${task.status}`)
        .text(`Priority: ${task.priority}`)
        .text(`Assignee: ${task.assignee.name}`)
        .text(`Due Date: ${new Date(task.dueDate).toLocaleDateString()}`)
        .text(`Description: ${task.description}`)
        .moveDown();
    });

    // Add footer with date
    doc
      .fontSize(10)
      .text(
        `Report generated on ${new Date().toLocaleString()}`,
        0,
        doc.page.height - 50,
        { align: "center" }
      );

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(400).json({ message: error.message });
  }
};
