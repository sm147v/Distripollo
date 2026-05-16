import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "./_components/Sidebar";

export const metadata = {
  title: "Panel Admin · Distripollo La 94",
};

export default async function AdminLayout({ children }) {
  const usuario = await getSession();
  if (!usuario) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#FBF9F4] text-stone-900 font-sans">
      <Sidebar usuario={usuario} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
