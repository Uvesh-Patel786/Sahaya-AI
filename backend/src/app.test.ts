import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.js";

describe("Express app", () => {
  const app = createApp();

  it("should have Express app defined", () => {
    assert.ok(app, "App should be defined");
  });

  it("should have use method for middleware", () => {
    assert.equal(typeof app.use, "function", "App should have use method");
  });
});
