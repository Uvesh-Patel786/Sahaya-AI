import mongoose, { Schema, type InferSchemaType } from "mongoose";

const schemeSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    eligibility: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    requiredDocuments: { type: [String], default: [] },
    applicationProcess: { type: [String], default: [] },
    category: { type: String, required: true },
    states: { type: [String], default: ["ALL"] },
    targetGroups: { type: [String], default: [] },
    officialUrl: { type: String, required: true },
    sourceRef: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type SchemeDoc = InferSchemaType<typeof schemeSchema> & { _id: mongoose.Types.ObjectId };
export const Scheme = mongoose.model("Scheme", schemeSchema);
