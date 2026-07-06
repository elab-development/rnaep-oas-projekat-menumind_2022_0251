interface ChatMenuItem {
  name: string;
  categoryId?: string;
  description?: string | null;
  price: string | number;
  dietary?: string[];
  popular?: boolean;
  isAvailable?: boolean;
}

interface MessagePart {
  type: string;
  text?: string;
}

interface ChatMessage {
  role: string;
  parts?: MessagePart[];
  content?: string;
}

export function buildMenuText(items: ChatMenuItem[]) {
  return items
    .map((item) => {
      const dietary = item.dietary?.length ? item.dietary.join(", ") : "-";
      return [
        `Item: ${item.name}`,
        `Category: ${item.categoryId ?? "-"}`,
        `Description: ${item.description ?? "-"}`,
        `Price: ${item.price} EUR`,
        `Dietary: ${dietary}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildChatSystemPrompt(
  restaurantName: string,
  menuText: string,
) {
  return `You are MenuMind, an AI assistant for the restaurant "${restaurantName}". The menu is as follows:\n\n${menuText}\n\nAnswer the user's questions based on the menu. If you don't know the answer, say you don't know. Be concise and friendly.`;
}

export function lastUserText(messages: ChatMessage[]) {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const message = list[i];
    if (message?.role !== "user") continue;
    const fromParts = (message.parts ?? [])
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join(" ")
      .trim();
    if (fromParts) return fromParts;
    if (typeof message.content === "string" && message.content.trim()) {
      return message.content.trim();
    }
  }
  return "";
}

export function chunkWords(text: string, size = 5) {
  const words = String(text ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

const OFFLINE_NOTE =
  "(AI assistant is temporarily offline — these are our staff picks.)";

export function heuristicAnswer(
  restaurantName: string,
  menuItems: ChatMenuItem[],
  userText: string,
) {
  const items = Array.isArray(menuItems) ? menuItems : [];
  const queryWords = String(userText ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

  const score = (item: ChatMenuItem) => {
    let value = 0;
    if (item.popular) value += 2;
    if (item.isAvailable !== false) value += 1;
    const haystack = [item.name, item.description, ...(item.dietary ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (queryWords.some((w) => haystack.includes(w))) value += 4;
    return value;
  };

  const picks = [...items].sort((a, b) => score(b) - score(a)).slice(0, 3);

  if (picks.length === 0) {
    return `Welcome to ${restaurantName}! Our menu is being updated right now — please ask our staff for today's specials. ${OFFLINE_NOTE}`;
  }

  const list = picks
    .map((item) => `${item.name} (${item.price} EUR)`)
    .join(", ");
  return `Thanks for asking! Here are some favorites at ${restaurantName}: ${list}. Let our staff know about any dietary needs and enjoy your meal! ${OFFLINE_NOTE}`;
}
