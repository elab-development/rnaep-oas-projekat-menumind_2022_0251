import { betterAuth } from "better-auth";
import pg from "pg";

export const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://auth:auth@localhost:5441/menumind_auth",
});

const trustedOrigins = (
  process.env.TRUSTED_ORIGINS || "http://localhost:3000,http://localhost:8080"
).split(",");

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080",
  secret:
    process.env.BETTER_AUTH_SECRET || "dev-only-insecure-secret-change-me",
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: "string", required: false },
      restaurantId: { type: "string", required: false },
    },
  },
  trustedOrigins,
});
