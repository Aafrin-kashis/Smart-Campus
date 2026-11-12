const mongoose = require("mongoose");

const busReservationSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requesterName: {
      type: String,
      required: true,
    },

    requesterType: {
      type: String,
      enum: ["Student", "Staff"],
      required: true,
    },

    studentId: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    travelDate: {
      type: String,
      required: true,
    },

    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    passengers: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      required: true,
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

const BusReservation = mongoose.model(
  "BusReservation",
  busReservationSchema
);

module.exports = BusReservation;