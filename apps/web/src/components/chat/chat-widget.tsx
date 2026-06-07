"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, ArrowLeft, MessageSquare } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  subject?: string | null;
  bookingId?: string | null;
  status: string;
  updatedAt: string;
  booking?: {
    id: string;
    bookingCode: string;
    room: { roomNumber: string; roomType: { name: string } };
  } | null;
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
}

interface ConversationFull {
  id: string;
  subject?: string | null;
  messages: Message[];
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [lastReadCount, setLastReadCount] = useState(0);
  const user = useAuthStore((s) => s.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["chat-conversations"],
    enabled: !!user,
    refetchInterval: open ? 8000 : 0,
    queryFn: () =>
      api.get<ConversationItem[]>("/chat/customer/conversations").then((r) => r.data),
  });

  const conversationQ = useQuery({
    queryKey: ["chat-conversation", activeId],
    enabled: !!user && !!activeId,
    queryFn: () =>
      api
        .get<ConversationFull>(`/chat/conversation/${activeId}`)
        .then((r) => r.data),
  });

  const messages = conversationQ.data?.messages ?? [];
  const subject = conversationQ.data?.subject;

  const totalStaffMessages = useMemo(() => {
    if (!user) return 0;
    let count = 0;
    if (listQ.data) {
      for (const c of listQ.data) {
        if (c.lastMessage && c.lastMessage.senderId !== user.id) {
          count++;
        }
      }
    }
    return count;
  }, [listQ.data, user]);

  const unreadCount = Math.max(0, totalStaffMessages - lastReadCount);

  useEffect(() => {
    if (open) {
      setLastReadCount(totalStaffMessages);
    }
  }, [open, totalStaffMessages]);

  const sendM = useMutation({
    mutationFn: (content: string) =>
      api
        .post(`/chat/conversation/${activeId}/messages`, { content })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-conversation", activeId] });
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
      setMessage("");
    },
    onError: (err) =>
      toast.error("Gửi tin nhắn thất bại", getApiErrorMessage(err)),
  });

  useEffect(() => {
    if (open && view === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, view]);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setView("chat");
  };

  const handleBack = () => {
    setView("list");
    setActiveId(null);
    setMessage("");
  };

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      setView("list");
      setActiveId(null);
    } else {
      setOpen(false);
      setView("list");
      setActiveId(null);
    }
  };

  if (!user) return null;

  const conversationItems = listQ.data ?? [];

  const getTitle = (c: ConversationItem) => {
    if (c.booking) {
      return `Đơn ${c.booking.bookingCode}`;
    }
    return c.subject ?? "Hỗ trợ chung";
  };

  const getSubtitle = (c: ConversationItem) => {
    if (c.booking) {
      return c.booking.room.roomType?.name
        ? `${c.booking.room.roomType.name} - ${c.booking.room.roomNumber}`
        : `Phòng ${c.booking.room.roomNumber}`;
    }
    return "Trao đổi với lễ tân";
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86_400_000) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const isLoading = listQ.isFetching && !listQ.data;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="flex h-[520px] w-[400px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            {view === "chat" ? (
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={handleBack}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {subject ?? "Hỗ trợ chung"}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Tin nhắn
                </p>
                <p className="text-xs text-slate-500">
                  Trao đổi với lễ tân về đơn hàng và câu hỏi chung
                </p>
              </div>
            )}
            <button
              onClick={handleToggle}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {view === "list" && (
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                    >
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && conversationItems.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <MessageSquare className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Chưa có cuộc trò chuyện nào
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Hãy gửi câu hỏi chung hoặc chat trong chi tiết đơn hàng
                  </p>
                </div>
              )}
              {!isLoading &&
                conversationItems.map((c) => {
                  const isLastFromStaff =
                    c.lastMessage && c.lastMessage.senderId !== user.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          c.bookingId
                            ? "bg-sky-100 text-sky-600"
                            : "bg-brand-100 text-brand-600",
                        )}
                      >
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {getTitle(c)}
                          </p>
                          {c.lastMessage && (
                            <span className="shrink-0 text-[10px] text-slate-400">
                              {formatTime(c.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 truncate text-xs",
                            isLastFromStaff
                              ? "font-medium text-slate-800"
                              : "text-slate-500",
                          )}
                        >
                          {getSubtitle(c)}
                        </p>
                        {c.lastMessage && (
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {c.lastMessage.senderId === user.id
                              ? "Bạn: "
                              : ""}
                            {c.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {view === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {conversationQ.isLoading && (
                  <div className="text-center text-sm text-slate-400">
                    Đang tải…
                  </div>
                )}
                {!conversationQ.isLoading && messages.length === 0 && (
                  <div className="text-center text-sm text-slate-400">
                    <p>Chưa có tin nhắn nào. Hãy gửi câu hỏi của bạn.</p>
                  </div>
                )}
                {messages.map((msg, idx, arr) => {
                  const isMe = msg.senderId === user.id;
                  const showName =
                    idx === 0 || arr[idx - 1].senderId !== msg.senderId;
                  return (
                    <div key={msg.id} className="space-y-0.5">
                      {showName && (
                        <p
                          className={cn(
                            "text-[10px] font-medium text-slate-400",
                            isMe ? "text-right" : "text-left",
                          )}
                        >
                          {isMe ? "Bạn" : "Hỗ trợ"}
                        </p>
                      )}
                      <div
                        className={cn(
                          "flex max-w-[80%]",
                          isMe ? "ml-auto justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2 text-sm",
                            isMe
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-800",
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-slate-100 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && message.trim()) {
                        sendM.mutate(message.trim());
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                  <Button
                    size="sm"
                    onClick={() => sendM.mutate(message.trim())}
                    disabled={!message.trim() || sendM.isPending}
                    loading={sendM.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={handleToggle}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
