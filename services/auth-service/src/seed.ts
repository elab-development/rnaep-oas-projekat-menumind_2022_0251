import type { Pool } from "pg";

export const DEMO_RESTAURANT_ID = "11111111-1111-4111-8111-111111111111";

interface SeedAccount {
  name: string;
  email: string;
  password: string;
  role: "SYSTEM_ADMIN" | "RESTAURANT_ADMIN";
  restaurantId: string | null;
}

interface AuthLike {
  api: {
    signUpEmail(args: { body: { name: string; email: string; password: string } }): Promise<unknown>;
  };
}

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    name: "System Admin",
    email: process.env.SEED_SYSTEM_ADMIN_EMAIL || "admin@menumind.local",
    password: process.env.SEED_SYSTEM_ADMIN_PASSWORD || "admin12345",
    role: "SYSTEM_ADMIN",
    restaurantId: null,
  },
  {
    name: "Demo Restaurant Admin",
    email: process.env.SEED_RESTAURANT_ADMIN_EMAIL || "demo@menumind.local",
    password: process.env.SEED_RESTAURANT_ADMIN_PASSWORD || "demo12345",
    role: "RESTAURANT_ADMIN",
    restaurantId: DEMO_RESTAURANT_ID,
  },
];

export async function seedUsers(auth: AuthLike, pool: Pool) {
  for (const account of SEED_ACCOUNTS) {
    const existing = await pool.query(
      'SELECT id FROM "user" WHERE email = $1',
      [account.email],
    );
    if (existing.rowCount && existing.rowCount > 0) continue;

    await auth.api.signUpEmail({
      body: { name: account.name, email: account.email, password: account.password },
    });

    await pool.query(
      'UPDATE "user" SET role = $1, "restaurantId" = $2, "emailVerified" = true WHERE email = $3',
      [account.role, account.restaurantId, account.email],
    );
    console.log(`[auth-service] seeded ${account.role} account: ${account.email}`);
  }
}
