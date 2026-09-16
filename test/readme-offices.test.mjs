import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("README office setup matches office configuration", async () => {
  const { stderr } = await execFileAsync(process.execPath, ["scripts/sync-readme-offices.mjs", "--check"]);
  assert.equal(stderr, "");
});
