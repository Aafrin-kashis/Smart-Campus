
const mongoose = require("mongoose");

const SIGNATURE_ROLES = [
  "Tabulator",
  "ExaminationController",
  "Principal",
];

const signatureSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: SIGNATURE_ROLES,
      required: true,
    },

    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    signaturePath: {
      type: String,
      required: true,
    },

    page: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Signature placement in percentage (0–100)
    x: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    y: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    width: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    height: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    signedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const applicationSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
    },

    studentId: {
      type: String,
      required: true,
    },

    applicationType: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    // Linked Exam Form for Admit Card Request
    examApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamApplication",
      default: null,
    },

    // Original uploaded document
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

    // Roles required to sign THIS document.
    // This list is independent for every application.
    requiredSigners: {
      type: [
        {
          type: String,
          enum: SIGNATURE_ROLES,
        },
      ],
      default: [],
    },

    // Signatures added to this document
    signatures: {
      type: [signatureSchema],
      default: [],
    },

    // Final PDF after signatures have been embedded
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

    recipientRole: {
      type: String,
      enum: [
        "Admin",
        "Principal",
        "HOD",
        "Library",
        "ExaminationController",
        "Tabulator",
        "MessCanteen",
        "Transport",
        "Department",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
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

const Application = mongoose.model(
  "Application",
  applicationSchema
);

module.exports = Application;
