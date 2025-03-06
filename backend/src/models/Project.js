const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["Manager", "Member"],
          default: "Member",
        },
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Completed", "On Hold"],
      default: "Active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if user is a member of the project
projectSchema.methods.isMember = function (userId) {
  return (
    this.owner.toString() === userId.toString() ||
    this.members.some((member) => {
      const memberId = member.user._id ? member.user._id : member.user;
      return memberId.toString() === userId.toString();
    })
  );
};

// Method to check if user is a manager of the project
projectSchema.methods.isManager = function (userId) {
  return (
    this.owner.toString() === userId.toString() ||
    this.members.some((member) => {
      const memberId = member.user._id ? member.user._id : member.user;
      return (
        memberId.toString() === userId.toString() && member.role === "Manager"
      );
    })
  );
};

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
