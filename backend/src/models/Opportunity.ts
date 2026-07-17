import mongoose, { Schema, type InferSchemaType } from "mongoose";

const opportunitySchema = new Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["scholarship", "internship", "hackathon", "job", "grant", "incubator", "fellowship"],
      required: true,
    },
    description: { type: String, required: true },
    eligibility: { type: [String], default: [] },
    deadline: Date,
    url: { type: String, required: true },
    targetGroups: { type: [String], default: [] },
    states: { type: [String], default: ["ALL"] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type OpportunityDoc = InferSchemaType<typeof opportunitySchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Opportunity = mongoose.model("Opportunity", opportunitySchema);
