import postgres from "postgres";

export const sql = postgres(
  process.env.DATABASE_URL || "postgres://menu:menu@localhost:5442/menumind_menu",
);
