import { apiUrl } from "@/lib/api";
import { Category } from "./_components/types";

export async function fetchCategories() {
  const res = await fetch(apiUrl(`/api/categories`), {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json() as Promise<Category[]>;
}

export async function createCategory(category: Partial<Category>) {
  const res = await fetch(apiUrl("/api/categories"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(category),
  });

  if (!res.ok) {
    throw new Error("Failed to create category");
  }

  return res.json() as Promise<Category>;
}

export async function updateCategory(category: Category) {
  const res = await fetch(apiUrl(`/api/categories/${category.id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(category),
  });

  if (!res.ok) {
    throw new Error("Failed to update category");
  }

  return res.json() as Promise<Category>;
}

export async function deleteCategory(id: string) {
  const res = await fetch(apiUrl(`/api/categories/${id}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to delete category");
  }
}
