import mongoose, { Schema, type InferSchemaType } from "mongoose";

const twinSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    age: Number,
    gender: String,
    state: String,
    district: String,
    education: String,
    occupation: String,
    incomeBand: String,
    categories: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    preferences: {
      notifications: { type: Boolean, default: true },
      voiceEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export type TwinDoc = InferSchemaType<typeof twinSchema> & { _id: mongoose.Types.ObjectId };
export const DigitalTwin = mongoose.model("DigitalTwin", twinSchema);
