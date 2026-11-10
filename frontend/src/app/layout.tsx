import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "800"] });
const texto = Public_Sans({ subsets: ["latin"], variable: "--font-texto" });

export const metadata: Metadata = {
  title: "Venta por Catálogo",
  description: "Catálogo de campaña, pedidos, inventario y comisiones de la red de vendedoras.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-DO" className={`${display.variable} ${texto.variable}`}>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
