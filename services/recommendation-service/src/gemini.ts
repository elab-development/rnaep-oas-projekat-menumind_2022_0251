import { google } from "@ai-sdk/google";
import { convertToModelMessages, generateText, type UIMessage } from "ai";

function assertApiKey() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }
}

export async function generateChatReply({
  system,
  messages,
}: {
  system: string;
  messages: UIMessage[];
}) {
  assertApiKey();
  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    system,
    messages: await convertToModelMessages(messages),
  });
  return text;
}
