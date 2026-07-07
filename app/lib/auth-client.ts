import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Auth now lives in the Auth Service, reached through the API Gateway.
// The additional user fields (role, restaurantId) mirror the server-side
// better-auth configuration in services/auth-service/src/auth.js.
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
