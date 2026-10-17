import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import "./new-style.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ספר המתכונים | Recipe Book",
  description: "ספר מתכונים אישי — אספו, ארגנו ושתפו את המתכונים האהובים עליכם",
  keywords: ["recipes", "cookbook", "מתכונים", "ספר מתכונים"],
  manifest: "/manifest.json",
  other: {
    "theme-color": "#245C43",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "ספר המתכונים"
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable} suppressHydrationWarning>
      <body>
        <AppProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
