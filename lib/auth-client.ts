import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const { signIn, signOut, signUp, getSession, useSession } =
  createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    plugins: [
      inferAdditionalFields({
        user: {
          role: { type: "string", required: false },
          restaurantId: { type: "string", required: false },
        },
      }),
    ],
  });
