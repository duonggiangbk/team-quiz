import type { Metadata } from "next";
import { Suspense } from "react";
import AccountBar from "@/components/AccountBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Quiz – Lớp học vui",
  description: "Trò chơi, thẻ học và bài tập vui cho lớp học",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="h-14" />}>
          <AccountBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
