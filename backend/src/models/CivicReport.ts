import mongoose, { Schema, type InferSchemaType } from "mongoose";

const civicSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    issueType: { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    department: { type: String, required: true },
    description: { type: String, default: "" },
    aiComplaintText: { type: String, default: "" },
    photoPath: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    status: {
      type: String,
      enum: ["submitted", "acknowledged", "in_progress", "resolved"],
      default: "submitted",
    },
    trackingId: { type: String, required: true, unique: true },
    confidence: { type: Number, default: 0.7 },
  },
  { timestamps: true }
);

civicSchema.index({ location: "2dsphere" });

export type CivicDoc = InferSchemaType<typeof civicSchema> & { _id: mongoose.Types.ObjectId };
export const CivicReport = mongoose.model("CivicReport", civicSchema);
