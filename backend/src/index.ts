import mongoose from "mongoose";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { Scheme } from "./models/Scheme.js";
import { Opportunity } from "./models/Opportunity.js";

async function connectMongo() {
  const uri = config.mongodbUri;
  const useMemory =
    process.env.USE_MEMORY_DB === "1" ||
    uri === "memory" ||
    uri.includes("localhost:27017");

  if (useMemory) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
      console.log("MongoDB connected:", uri);
      return;
    } catch {
      console.warn("Local MongoDB unavailable — starting in-memory MongoDB");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mem = await MongoMemoryServer.create();
      const memUri = mem.getUri("sahayak");
      await mongoose.connect(memUri);
      console.log("In-memory MongoDB ready");
      // Keep reference so GC does not stop the server
      (globalThis as { __sahayakMemMongo?: typeof mem }).__sahayakMemMongo = mem;
      return;
    }
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

async function seedIfEmpty() {
  const count = await Scheme.countDocuments();
  if (count > 0) return;
  console.log("Seeding schemes & opportunities…");
  const { default: seedMod } = await import("./seedData.js");
  await Scheme.insertMany(seedMod.schemes);
  await Opportunity.insertMany(seedMod.opportunities);
  console.log("Seed complete");
}

async function main() {
  await connectMongo();
  await seedIfEmpty();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Sahayak backend listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
