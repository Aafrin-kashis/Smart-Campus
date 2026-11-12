const mongoose = require("mongoose");

const documentRequestSchema = new mongoose.Schema(
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

    requestType: {
      type: String,
      enum: [
        "TR",
        "Bonafide",
        "No Dues",
        "Other Document",
      ],
      required: true,
    },

    recipientRole: {
      type: String,
      enum: [
        "Principal",
        "ExaminationController",
        "HOD",
        "Library",
        "MessCanteen",
        "Admin",
      ],
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    document: {
      fileName: {
        type: String,
        default: "",
      },

      filePath: {
        type: String,
        default: "",
      },

      fileType: {
        type: String,
        default: "",
      },
    },

        signedDocument: {
      fileName: {
        type: String,
        default: "",
      },

      filePath: {
        type: String,
        default: "",
      },

      fileType: {
        type: String,
        default: "",
      },
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    remarks: {
      type: String,
      default: "",
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DocumentRequest = mongoose.model(
  "DocumentRequest",
  documentRequestSchema
);

module.exports = DocumentRequest;