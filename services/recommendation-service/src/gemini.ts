import { google } from "@ai-sdk/google";
import { convertToModelMessages, generateText } from "ai";
import CircuitBreaker from "opossum";
import { trackBreaker } from "./lib/metrics.js";

type ChatMessagePart = {
  type: string;
  text?: string;
};

type ChatMessage = {
  role: string;
  parts?: ChatMessagePart[];
  content?: string;
};

type GenerateChatReplyInput = {
  system: string;
  messages: ChatMessage[];
};

type GeminiRequest = Parameters<typeof generateText>[0];

async function callGemini(request: GeminiRequest): Promise<string> {
  const { text } = await generateText(request);
  return text;
}

export const geminiBreaker = new CircuitBreaker(callGemini, {
  timeout: 15000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});
trackBreaker(geminiBreaker, "gemini");

function assertApiKey() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }
}

export async function generateChatReply({
  system,
  messages,
}: GenerateChatReplyInput): Promise<string> {
  assertApiKey();
  return geminiBreaker.fire({
    model: google("gemini-2.5-flash"),
    system,
    messages: await convertToModelMessages(messages as never),
  });
}

export async function generateSuggestion(prompt: string): Promise<string> {
  assertApiKey();
  return geminiBreaker.fire({
    model: google("gemini-2.5-flash"),
    prompt,
  });
}
