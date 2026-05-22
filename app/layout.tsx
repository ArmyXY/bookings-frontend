import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Panel de reservas",
  description: "Base inicial del proyecto de gestion de reservas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
