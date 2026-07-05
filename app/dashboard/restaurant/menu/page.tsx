"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  isAvailable: boolean;
}

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/menu_items`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Menu Items</h1>
      {error && <p className="text-red-500">{error}</p>}
      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.price} €</td>
              <td>{item.isAvailable ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
