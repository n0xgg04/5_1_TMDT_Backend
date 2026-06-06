"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  messages: Message[];
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [lastReadCount, setLastReadCount] = useState(0);
  const user = useAuthStore((s) => s.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const conversationQ = useQuery({
    queryKey: ["chat-conversation"],
    enabled: !!user,
    refetchInterval: 5000,
    queryFn: () =>
      api.get<Conversation>("/chat/conversation").then((r) => r.data),
  });

  const staffMessagesCount = useMemo(() => {
    if (!conversationQ.data?.messages || !user) return 0;
    return conversationQ.data.messages.filter((m) => m.senderId !== user.id)
      .length;
  }, [conversationQ.data?.messages, user]);

  const unreadCount = Math.max(0, staffMessagesCount - lastReadCount);

  useEffect(() => {
    if (open) {
      setLastReadCount(staffMessagesCount);
    }
  }, [open, staffMessagesCount]);

  const sendM = useMutation({
    mutationFn: (content: string) =>
      api
        .post(`/chat/conversation/${conversationQ.data?.id}/messages`, {
          content,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-conversation"] });
      setMessage("");
    },
    onError: (err) =>
      toast.error("Gửi tin nhắn thất bại", getApiErrorMessage(err)),
  });

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationQ.data?.messages, open]);

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="flex h-[500px] w-[380px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Hỗ trợ trực tuyến
              </p>
              <p className="text-xs text-slate-500">Phản hồi trong vài phút</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {conversationQ.isLoading && (
              <div className="text-center text-sm text-slate-400">
                Đang tải…
              </div>
            )}
            {conversationQ.data?.messages?.length === 0 && (
              <div className="text-center text-sm text-slate-400">
                Chào bạn! Chúng tôi có thể giúp gì?
              </div>
            )}
            {conversationQ.data?.messages?.map((msg, idx, arr) => {
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

          <div className="border-t border-slate-100 p-3">
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
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
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
