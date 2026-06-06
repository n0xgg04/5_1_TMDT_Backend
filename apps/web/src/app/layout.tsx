import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { ChatWrapper } from "@/components/chat/chat-wrapper";

export const metadata: Metadata = {
  title: "Sapphire Stay – Hệ thống đặt phòng khách sạn",
  description:
    "Đặt phòng khách sạn trực tuyến nhanh chóng, an toàn và tiện lợi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50">
        <Providers>
          <Navbar />
          {children}
          <ChatWrapper />
        </Providers>
      </body>
    </html>
  );
}
