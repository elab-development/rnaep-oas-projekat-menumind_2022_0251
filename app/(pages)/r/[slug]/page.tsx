import { MenuItem } from "@/(pages)/dashboard/restaurant/menu/_components/types";
import { apiUrl } from "@/lib/api";
import { Restaurants } from "@/lib/types";
import AIChatbot from "./_components/ai-chatbot";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function RestaurantPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const tableNumber = typeof sp.table === "string" ? sp.table : undefined;

  // Public menu data now comes from the Menu Service through the API Gateway
  // (which also records a menu-viewed analytics event).
  const query = tableNumber
    ? `?table=${encodeURIComponent(tableNumber)}`
    : "";

  let data: { restaurant: Restaurants; menuItems: MenuItem[] } | null = null;
  try {
    const res = await fetch(
      apiUrl(`/api/public/restaurants/${encodeURIComponent(slug)}${query}`),
      { cache: "no-store" },
    );
    if (res.ok) {
      data = await res.json();
    }
  } catch {
    data = null;
  }

  if (!data?.restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Restaurant Not Found</h1>
      </div>
    );
  }

  return (
    <AIChatbot
      menuItems={data.menuItems}
      restaurant={data.restaurant}
      tableNumber={tableNumber}
    />
  );
}
