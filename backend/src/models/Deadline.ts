import mongoose, { Schema, type InferSchemaType } from "mongoose";

const deadlineSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["document_expiry", "scholarship", "subsidy", "licence", "custom"],
      default: "custom",
    },
    dueDate: { type: Date, required: true },
    relatedDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    relatedSchemeId: { type: Schema.Types.ObjectId, ref: "Scheme" },
    status: {
      type: String,
      enum: ["upcoming", "due_soon", "overdue", "done"],
      default: "upcoming",
    },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

deadlineSchema.index({ userId: 1, dueDate: 1 });

export type DeadlineDoc = InferSchemaType<typeof deadlineSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Deadline = mongoose.model("Deadline", deadlineSchema);
