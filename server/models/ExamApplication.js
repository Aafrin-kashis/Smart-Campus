const mongoose = require("mongoose");

const examApplicationSchema = new mongoose.Schema(
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

    examFormNumber: {
      type: String,
      default: "",
    },

    examName: {
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

    dateOfBirth: {
      type: String,
      default: "",
    },

    fatherName: {
      type: String,
      default: "",
    },

    motherName: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    pinCode: {
      type: String,
      default: "",
    },

    collegeName: {
      type: String,
      default: "",
    },

    universityRegistrationNo: {
      type: String,
      default: "",
    },

    collegeRollNo: {
      type: String,
      default: "",
    },

    subjects: [
      {
        code: {
          type: String,
          default: "",
        },

        name: {
          type: String,
          required: true,
        },
      },
    ],

    examFee: {
      type: Number,
      required: true,
    },

    transactionId: {
      type: String,
      default: "",
    },

    feeReceipt: {
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

    // =========================
    // ADMIT CARD
    // =========================
    admitCard: {
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

      uploadedAt: {
        type: Date,
        default: null,
      },
    },

    admitCardUploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =========================
    // APPLICATION STATUS
    // =========================
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

const ExamApplication = mongoose.model(
  "ExamApplication",
  examApplicationSchema
);

module.exports = ExamApplication;