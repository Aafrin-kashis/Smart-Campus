const mongoose = require("mongoose");

const principalSignatureSchema =
  new mongoose.Schema(
    {
      principal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      fileName: {
        type: String,
        required: true,
      },

      filePath: {
        type: String,
        required: true,
      },

      fileType: {
        type: String,
        default: "image/png",
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

const PrincipalSignature =
  mongoose.model(
    "PrincipalSignature",
    principalSignatureSchema
  );

module.exports =
  PrincipalSignature;