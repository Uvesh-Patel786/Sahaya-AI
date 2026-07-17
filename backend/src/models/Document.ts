import mongoose, { Schema, type InferSchemaType } from "mongoose";

const documentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
    category: {
      type: String,
      enum: ["aadhaar", "pan", "income", "residence", "caste", "passport", "letter", "other"],
      default: "other",
    },
    ocrText: { type: String, default: "" },
    extractedFields: { type: Schema.Types.Mixed, default: {} },
    expiryDate: Date,
    analysisSummary: { type: String, default: "" },
    status: { type: String, enum: ["uploaded", "analyzed", "error"], default: "uploaded" },
  },
  { timestamps: true }
);

export type DocumentDoc = InferSchemaType<typeof documentSchema> & { _id: mongoose.Types.ObjectId };
export const DocumentModel = mongoose.model("Document", documentSchema);
