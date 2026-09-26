import { execFileSync } from "node:child_process";

// Docker targets only the local Supabase container. Every supplied fixture rolls back.
export function runPolicySqlTest(sql) {
  const database = process.env.POLICY_TEST_DATABASE;
  if (!database || !/^[a-zA-Z0-9_]+$/.test(database)) throw new Error("Set POLICY_TEST_DATABASE to the local test database name.");
  execFileSync("docker", ["exec", "-i", "supabase_db_passage-authority", "psql", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1"], { input: sql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}
