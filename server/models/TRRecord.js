
const mongoose = require("mongoose");

const trRecordSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      required: true,
      trim: true,
    },

    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },

    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
      select: false,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sourceType: {
      type: String,
      enum: ["combined", "individual"],
      required: true,
    },

    sourceFileName: {
      type: String,
      default: "",
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

// Prevent duplicate active records for the same student/session.
trRecordSchema.index(
  {
    session: 1,
    registrationNumber: 1,
    rollNumber: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("TRRecord", trRecordSchema);
