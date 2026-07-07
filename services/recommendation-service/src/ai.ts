type MenuItemLike = {
  name: string;
  categoryId?: string;
  description?: string | null;
  price: string | number;
  dietary?: string[];
  popular?: boolean;
  isAvailable?: boolean;
};

type ChatMessagePart = {
  type: string;
  text?: string;
};

type ChatMessage = {
  role: string;
  parts?: ChatMessagePart[];
  content?: string;
};

export function buildSystemInstruction(restaurantName: string): string {
  return `
You are MenuMind, an AI assistant for the restaurant "${restaurantName}".

Rules:
- Recommend only menu items provided.
- Never invent dishes.
- Max 3 recommendations.
- Be friendly and concise.
`;
}

export function buildMenuText(items: MenuItemLike[]): string {
  return items
    .map((item: MenuItemLike) => {
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
): string {
  return `You are MenuMind, an AI assistant for the restaurant "${restaurantName}". The menu is as follows:\n\n${menuText}\n\nAnswer the user's questions based on the menu. If you don't know the answer, say you don't know. Be concise and friendly.`;
}

export function lastUserText(messages: ChatMessage[]): string {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const message = list[i];
    if (message?.role !== "user") continue;
    const fromParts = (message.parts ?? [])
      .filter(
        (part: ChatMessagePart) =>
          part?.type === "text" && typeof part.text === "string",
      )
      .map((part: ChatMessagePart) => part.text)
      .join(" ")
      .trim();
    if (fromParts) return fromParts;
    if (typeof message.content === "string" && message.content.trim()) {
      return message.content.trim();
    }
  }
  return "";
}

export function chunkWords(text: string, size = 5): string[] {
  const words = String(text ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

const OFFLINE_NOTE =
  "(AI assistant is temporarily offline — these are our staff picks.)";

export function heuristicAnswer(
  restaurantName: string,
  menuItems: MenuItemLike[],
  userText: string,
): string {
  const items = Array.isArray(menuItems) ? menuItems : [];
  const queryWords = String(userText ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3);

  const score = (item: MenuItemLike): number => {
    let value = 0;
    if (item.popular) value += 2;
    if (item.isAvailable !== false) value += 1;
    const haystack = [item.name, item.description, ...(item.dietary ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (queryWords.some((word) => haystack.includes(word))) value += 4;
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

const PAIRING_RULES = [
  {
    pattern: /pizza|pasta|risotto|lasagn/i,
    pairing: "a glass of Italian red wine",
  },
  {
    pattern: /burger|sandwich|wrap|hot ?dog/i,
    pairing: "crispy fries and a house lemonade",
  },
  {
    pattern: /salad|bowl|soup/i,
    pairing: "a fresh-pressed juice and warm bread",
  },
  {
    pattern: /fish|salmon|tuna|seafood|shrimp|calamari/i,
    pairing: "a chilled glass of white wine",
  },
  { pattern: /steak|beef|ribs|grill|bbq/i, pairing: "a full-bodied red wine" },
  {
    pattern: /cake|dessert|ice cream|tiramisu|brownie|pancake/i,
    pairing: "an espresso or cappuccino",
  },
  {
    pattern: /coffee|espresso|latte|cappuccino|tea/i,
    pairing: "a slice of homemade cake",
  },
];

export function heuristicSuggestion(
  item: MenuItemLike | null | undefined,
): string {
  const name = item?.name ? String(item.name) : "this dish";
  const dietary = Array.isArray(item?.dietary)
    ? item.dietary.map((tag: string) => String(tag).toLowerCase())
    : [];
  const price = Number.parseFloat(String(item?.price ?? ""));

  let pairing = "one of our seasonal sides";
  for (const rule of PAIRING_RULES) {
    if (rule.pattern.test(name)) {
      pairing = rule.pairing;
      break;
    }
  }
  if (dietary.includes("vegan")) {
    pairing = "a vegan dessert or a fresh-pressed juice";
  } else if (dietary.includes("vegetarian")) {
    pairing = "a vegetarian starter or a fresh-pressed juice";
  }

  const upsell =
    Number.isFinite(price) && price >= 15
      ? "Present it as a signature dish and offer a shareable starter first."
      : "Offer it as an add-on or combo to lift the average order value.";

  return `Pair ${name} with ${pairing}. ${upsell}`;
}
