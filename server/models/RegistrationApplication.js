const mongoose = require("mongoose");

const registrationApplicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    studentId: {
      type: String,
      required: true,
    },

    session: {
      type: String,
      required: true,
    },

    semester: {
      type: String,
      required: true,
    },

    course: {
      type: String,
      required: true,
    },

    registrationNumber: {
      type: String,
      default: "",
    },

    details: {
      type: String,
      default: "",
    },

    documents: [
      {
        fileName: String,
        filePath: String,
        fileType: String,
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    departmentRemark: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RegistrationApplication = mongoose.model(
  "RegistrationApplication",
  registrationApplicationSchema
);

module.exports = RegistrationApplication;