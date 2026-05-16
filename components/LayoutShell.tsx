"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const esAdmin = pathname.startsWith("/admin");
  const esLogin = pathname.startsWith("/login");

  if (esAdmin || esLogin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-200px)]">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
