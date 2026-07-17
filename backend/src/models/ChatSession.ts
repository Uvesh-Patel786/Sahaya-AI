import mongoose, { Schema, type InferSchemaType } from "mongoose";

const chatSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New chat" },
    language: { type: String, enum: ["en", "hi", "gu"], default: "en" },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant", "system"], required: true },
        content: { type: String, required: true },
        sources: { type: [Schema.Types.Mixed], default: [] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export type ChatSessionDoc = InferSchemaType<typeof chatSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
