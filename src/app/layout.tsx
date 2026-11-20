import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ô Số Đồng Đội – Team Quiz",
  description: "Trò chơi đố vui theo đội cho lớp học",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
