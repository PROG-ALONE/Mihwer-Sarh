"use strict";

const { spawnSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { join, resolve } = require("node:path");

const workdir = process.env.MIHWAR_LOCAL_SUPABASE_WORKDIR;
if (!workdir) {
  throw new Error("Set MIHWAR_LOCAL_SUPABASE_WORKDIR to the isolated local Supabase test workdir.");
}

const isolatedWorkdir = resolve(workdir);
const config = readFileSync(join(isolatedWorkdir, "supabase", "config.toml"), "utf8");
if (!/^project_id\s*=\s*"mihwer-isolated-test"\s*$/m.test(config)) {
  throw new Error("Refusing pgTAP run: the configured project is not mihwer-isolated-test.");
}

const result = spawnSync("supabase", [
  "test",
  "db",
  "--workdir",
  isolatedWorkdir,
  "supabase/tests"
], {
  cwd: resolve(__dirname, ".."),
  stdio: "inherit"
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
