import mongoose from "mongoose";
import { config } from "./config.js";
import { Scheme } from "./models/Scheme.js";
import { Opportunity } from "./models/Opportunity.js";
import { schemes, opportunities } from "./seedData.js";

async function seed() {
  await mongoose.connect(config.mongodbUri);
  await Scheme.deleteMany({});
  await Opportunity.deleteMany({});
  await Scheme.insertMany(schemes);
  await Opportunity.insertMany(opportunities);
  console.log(`Seeded ${schemes.length} schemes and ${opportunities.length} opportunities`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
