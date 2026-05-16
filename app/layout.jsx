import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { LayoutShell } from "@/components/LayoutShell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetBrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Distripollo La 94 · El mejor pollo de Medellín",
  description: "Distribuidor premium de pollo campesino, congelados Bucanero, filetes Don Juan y más. Calidad garantizada para restaurantes, asaderos y hogares en Medellín. Domicilios diarios.",
  keywords: ["pollo Medellín", "distribuidor pollo", "pollo campesino", "Bucanero", "Don Juan", "pollo al por mayor", "carnicería Medellín"],
  openGraph: {
    title: "Distripollo La 94",
    description: "El mejor pollo de Medellín",
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${dmSans.variable} ${jetBrains.variable}`}>
      <body>
        <CartProvider>
          <LayoutShell>{children}</LayoutShell>
        </CartProvider>
      </body>
    </html>
  );
}
