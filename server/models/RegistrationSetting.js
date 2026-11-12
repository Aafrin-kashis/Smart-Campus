const mongoose = require("mongoose");

const registrationSettingSchema = new mongoose.Schema(
  {
    registrationAllowed: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RegistrationSetting = mongoose.model(
  "RegistrationSetting",
  registrationSettingSchema
);

module.exports = RegistrationSetting;