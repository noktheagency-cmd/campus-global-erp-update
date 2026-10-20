import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Global ERP",
  description:
    "Campus Global xaricdə təhsil prosesləri üçün daxili ERP sistemi.",
  icons: {
    apple: "/brand/campus-global-logo.png",
    icon: "/brand/campus-global-logo.png",
    shortcut: "/brand/campus-global-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className="h-full antialiased">
      <body className="erp-soft-theme min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
