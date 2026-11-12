const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    studentId: {
      type: String,
      default: "",
      trim: true,
    },

    userType: {
      type: String,
      enum: ["Student", "Staff"],
      default: "Student",
    },

    role: {
      type: String,
      enum: [
        "Admin",
        "Student",
        "AppController",
        "Principal",
        "HOD",
        "Library",
        "ExaminationController",
        "Tabulator",
        "MessCanteen",
        "Transport",
        "Department",
      ],
      default: "Student",
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;