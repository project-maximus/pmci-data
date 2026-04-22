import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("session_user")?.value;

  if (!raw) {
    redirect("/");
  }

  let username = "";
  let role = "";

  try {
    const parsed = JSON.parse(raw);
    username = parsed.username || "";
    role = parsed.role || "";
  } catch {
    username = raw;
    role = "";
  }

  return <DashboardClient username={username} role={role} />;
}
