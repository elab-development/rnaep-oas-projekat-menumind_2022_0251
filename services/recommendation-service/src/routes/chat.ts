import { Router } from "express";
import { z } from "zod";
import {
  buildChatSystemPrompt,
  buildMenuText,
  chunkWords,
  heuristicAnswer,
  lastUserText,
} from "../ai.js";
import { generateChatReply } from "../gemini.js";

const chatMessagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});
const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["system", "user", "assistant", "tool"]),
  parts: z.array(chatMessagePartSchema).optional(),
  content: z.string().optional(),
});
const chatMenuItemSchema = z.object({
  name: z.string(),
  categoryId: z.string().optional(),
  description: z.string().nullable().optional(),
  price: z.union([z.string(), z.number()]),
  dietary: z.array(z.string()).optional(),
  popular: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});
const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema),
  restaurantName: z.string().max(200),
  menuItems: z.array(chatMenuItemSchema).max(200),
});

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { messages, restaurantName, menuItems } = parsed.data;
  const menuText = buildMenuText(menuItems);
  const system = buildChatSystemPrompt(restaurantName, menuText);

  let reply: string;
  try {
    reply = await generateChatReply({ system, messages: messages as never });
  } catch (err) {
    console.warn(
      `[chat] gemini unavailable (${(err as Error).message}), using heuristic fallback`,
    );
    reply = heuristicAnswer(restaurantName, menuItems, lastUserText(messages));
  }

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "x-vercel-ai-ui-message-stream": "v1",
  });

  const write = (o: object) => res.write(`data: ${JSON.stringify(o)}\n\n`);
  write({ type: "start" });
  write({ type: "text-start", id: "txt-1" });
  for (const chunk of chunkWords(reply, 5)) {
    write({ type: "text-delta", id: "txt-1", delta: `${chunk} ` });
  }
  write({ type: "text-end", id: "txt-1" });
  write({ type: "finish" });
  res.write("data: [DONE]\n\n");
  res.end();
});
