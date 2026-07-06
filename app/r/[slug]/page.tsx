"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const { messages, sendMessage } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_URL}/api/chat`,
  } as never);
  const [input, setInput] = useState("");

  params.then((p) => setSlug(p.slug));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(
      { text: input },
      {
        body: {
          restaurantName: slug,
          menuItems: [], 
        },
      },
    );
    setInput("");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">{slug}</h1>

      <div className="mt-6 space-y-2">
        {messages.map((m) => (
          <p key={m.id}><b>{m.role}:</b> {m.parts?.map((p) => (p.type === "text" ? p.text : "")).join("")}</p>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded-md border px-3 py-2" placeholder="Ask about the menu..." />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Send</button>
      </form>
    </main>
  );
}
