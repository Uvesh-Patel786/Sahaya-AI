import mongoose, { Schema, type InferSchemaType } from "mongoose";

const scamSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true },
    channel: {
      type: String,
      enum: ["sms", "email", "whatsapp", "notice", "other"],
      default: "other",
    },
    label: {
      type: String,
      enum: ["genuine", "suspicious", "fraudulent"],
      required: true,
    },
    confidence: { type: Number, required: true },
    reasons: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type ScamDoc = InferSchemaType<typeof scamSchema> & { _id: mongoose.Types.ObjectId };
export const ScamAnalysis = mongoose.model("ScamAnalysis", scamSchema);
