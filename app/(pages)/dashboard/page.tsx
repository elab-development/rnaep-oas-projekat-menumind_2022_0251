import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

const Dashboard = async () => {
  const session = await getServerSession();

  if (!session?.user) redirect("/auth/login");

  if (session.user.role === "SYSTEM_ADMIN") redirect("/dashboard/system-admin");
  if (session.user.role === "RESTAURANT_ADMIN")
    redirect("/dashboard/restaurant");

  return <div>Access denied.</div>;
};

export default Dashboard;
