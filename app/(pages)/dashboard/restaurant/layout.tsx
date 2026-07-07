import { apiUrl } from "@/lib/api";
import { getServerSession } from "@/lib/session";
import { CategoriesProvider } from "@/utils/useCategories";
import { MenuItemsProvider } from "@/utils/useMenuItems";
import { RestaurantProvider } from "@/utils/useRestaurant";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { AdminSidebar } from "./(dashboard-restaurant)/_components/admin-sidebar";

export default async function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "RESTAURANT_ADMIN") redirect("/dashboard");

  // Server-side data now comes from the Menu Service through the API Gateway,
  // forwarding the browser's cookies for authentication.
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const fetchOptions = {
    headers: { cookie },
    cache: "no-store" as const,
  };

  const restaurantRes = await fetch(apiUrl("/api/restaurants/me"), fetchOptions);
  if (!restaurantRes.ok) redirect("/auth/login");
  const restaurant = await restaurantRes.json();

  const [categoriesRes, menuItemsRes] = await Promise.all([
    fetch(apiUrl("/api/categories"), fetchOptions),
    fetch(apiUrl("/api/menu_items"), fetchOptions),
  ]);

  const restaurantCategories = categoriesRes.ok
    ? await categoriesRes.json()
    : [];
  const menu_items = menuItemsRes.ok ? await menuItemsRes.json() : [];

  return (
    <RestaurantProvider restaurant={restaurant}>
      <CategoriesProvider initialCategories={restaurantCategories}>
        <MenuItemsProvider initialMenuItems={menu_items}>
          <div className="flex min-h-screen bg-background">
            <AdminSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
            <Toaster />
          </div>
        </MenuItemsProvider>
      </CategoriesProvider>
    </RestaurantProvider>
  );
}
