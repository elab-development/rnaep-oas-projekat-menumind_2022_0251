import assert from "node:assert/strict";
import { test } from "node:test";
import { seedUsers } from "../src/seed.js";

function makeFakes({ existingEmails = [] as string[] } = {}) {
  const queries: { sql: string; params: unknown[] }[] = [];
  const signups: unknown[] = [];
  const pool = {
    async query(sql: string, params: unknown[]) {
      queries.push({ sql, params });
      if (sql.startsWith("SELECT")) {
        return {
          rowCount: existingEmails.includes(params[0] as string) ? 1 : 0,
        };
      }
      return { rowCount: 1 };
    },
  };
  const auth = {
    api: {
      async signUpEmail({ body }: { body: unknown }) {
        signups.push(body);
      },
    },
  };
  return { pool: pool as any, auth, queries, signups };
}

test("seeds system admin and demo restaurant admin when missing", async () => {
  const { pool, auth, queries, signups } = makeFakes();
  await seedUsers(auth, pool);

  assert.equal(signups.length, 2);
  const updates = queries.filter((q) => q.sql.startsWith("UPDATE"));
  assert.equal(updates.length, 2);
});

test("is idempotent: skips accounts that already exist", async () => {
  const { pool, auth, signups } = makeFakes({
    existingEmails: ["admin@menumind.local", "demo@menumind.local"],
  });
  await seedUsers(auth, pool);
  assert.equal(signups.length, 0);
});
