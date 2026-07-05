import express, { Request, Response } from "express";

const PORT = Number(process.env.PORT || 4001);
const app = express();
app.disable("x-powered-by");

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "auth-service" });
});

app.listen(PORT, () => {
  console.log(`[auth-service] listening on :${PORT}`);
});
