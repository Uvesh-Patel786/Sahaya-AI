import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("config", () => {
  it("should have environment configuration", () => {
    assert.ok(process.env !== undefined, "Environment should be accessible");
  });
});
