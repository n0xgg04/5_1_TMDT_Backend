"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ChatWidget = dynamic(
  () => import("@/components/chat/chat-widget").then((m) => m.ChatWidget),
  { ssr: false },
);

export function ChatWrapper() {
  const pathname = usePathname();
  const isBackOffice =
    pathname.startsWith("/admin") || pathname.startsWith("/staff");

  if (isBackOffice) return null;

  return <ChatWidget />;
}
