import { v2 as cloudinary } from "cloudinary";
import express from "express";
import { requireRestaurantAdmin, wrap } from "./lib/auth.js";
import { buildSignParams } from "./sign.js";

const PORT = Number(process.env.PORT || 4006);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

function cloudinaryEnv() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
}

function isConfigured() {
  const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
  return Boolean(cloudName && apiKey && apiSecret);
}

let configured = false;
function ensureCloudinary() {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  configured = true;
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "media-service",
    configured: isConfigured(),
  });
});

app.post(
  "/api/cloudinary/sign",
  requireRestaurantAdmin,
  wrap(async (req, res) => {
    if (!isConfigured()) {
      return res
        .status(503)
        .json({ error: "Media uploads are not configured" });
    }
    ensureCloudinary();

    const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
    const { timestamp, folder } = buildSignParams(
      req.user!.restaurantId,
      Math.round(Date.now() / 1000),
    );
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret!,
    );

    res.json({ timestamp, signature, cloudName, apiKey, folder });
  }),
);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[media-service] listening on :${PORT}`);
});
