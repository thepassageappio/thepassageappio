import { execFileSync } from "node:child_process";
import { readReleaseProvenance, validateProductionProvenance } from "../src/lib/authority/release-provenance.ts";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function gitOrNull(...args) {
  try {
    return git(...args);
  } catch {
    return null;
  }
}

const expectedSha = process.env.PASSAGE_EXPECTED_MAIN_SHA?.trim().toLowerCase() || null;
const provenance = readReleaseProvenance();
const issues = validateProductionProvenance(provenance, expectedSha);

if (!process.env.VERCEL) {
  const branch = gitOrNull("symbolic-ref", "--quiet", "--short", "HEAD");
  const worktree = git("status", "--porcelain");
  const head = git("rev-parse", "HEAD").toLowerCase();
  if (branch !== "main") issues.push("local_release_ref_not_main");
  if (worktree) issues.push("local_release_worktree_dirty");
  if (expectedSha && head !== expectedSha) issues.push("local_head_does_not_match_expected_main");
}

const result = {
  ok: issues.length === 0,
  expected_main_sha: expectedSha,
  deployed_sha: provenance.commitSha,
  deployed_ref: provenance.commitRef,
  issues,
};
console.log(JSON.stringify(result));
if (issues.length) process.exitCode = 1;
