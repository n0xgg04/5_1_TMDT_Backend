"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, CheckCircle, User, Clock, Send } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import {
  mergeConversationList,
  mergeMessageIntoConversation,
} from "@/lib/chat-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { ChatMessageCreatedEvent } from "@/lib/types";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerId: string;
  staffId: string | null;
  status: string;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { firstName: string; lastName: string; email: string };
  messages: Message[];
}

export default function AdminConversationsPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [chatStreamConnected, setChatStreamConnected] = useState(false);

  const listQ = useQuery({
    queryKey: ["admin-conversations"],
    refetchInterval: chatStreamConnected ? false : 5000,
    queryFn: () =>
      api.get<Conversation[]>("/chat/staff/conversations").then((r) => r.data),
  });

  const detailQ = useQuery({
    queryKey: ["admin-conversation", selectedId],
    enabled: !!selectedId,
    refetchInterval: chatStreamConnected ? false : 5000,
    queryFn: () =>
      api
        .get<Conversation>(`/chat/staff/conversations/${selectedId}`)
        .then((r) => r.data),
  });

  const handleChatMessage = useCallback(
    (event: ChatMessageCreatedEvent) => {
      qc.setQueryData<Conversation[]>(["admin-conversations"], (current) =>
        mergeConversationList(current, event) as Conversation[],
      );
      qc.setQueryData<Conversation>(
        ["admin-conversation", event.conversationId],
        (current) =>
          mergeMessageIntoConversation(current, event) as Conversation,
      );
    },
    [qc],
  );

  useChatRealtime({
    enabled: true,
    onMessage: handleChatMessage,
    onReconnect: () => {
      qc.invalidateQueries({ queryKey: ["admin-conversations"] });
      if (selectedId) {
        qc.invalidateQueries({ queryKey: ["admin-conversation", selectedId] });
      }
    },
    onConnectionChange: setChatStreamConnected,
  });

  const assignM = useMutation({
    mutationFn: (id: string) =>
      api
        .post(`/chat/staff/conversations/${id}/assign`, {})
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã nhận phụ trách");
      qc.invalidateQueries({ queryKey: ["admin-conversations"] });
    },
    onError: (err) => toast.error("Lỗi", getApiErrorMessage(err)),
  });

  const resolveM = useMutation({
    mutationFn: (id: string) =>
      api
        .post(`/chat/staff/conversations/${id}/resolve`, {})
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã đánh dấu hoàn thành");
      qc.invalidateQueries({ queryKey: ["admin-conversations"] });
    },
    onError: (err) => toast.error("Lỗi", getApiErrorMessage(err)),
  });

  const sendM = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api
        .post(`/chat/conversation/${id}/messages`, { content })
        .then((r) => r.data),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["admin-conversation", selectedId] });
    },
    onError: (err) => toast.error("Gửi thất bại", getApiErrorMessage(err)),
  });

  const conversations = listQ.data ?? [];
  const selected = detailQ.data;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hộp thư hỗ trợ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý và phản hồi tin nhắn từ khách hàng
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          {conversations.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-slate-500">
                Chưa có cuộc trò chuyện nào
              </CardContent>
            </Card>
          )}
          {conversations.map((c) => {
            const lastMsg = c.messages?.[0];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  selectedId === c.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">
                      {c.customer.firstName} {c.customer.lastName}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      c.status === "open"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-green-50 text-green-700",
                    )}
                  >
                    {c.status === "open" ? "Mở" : "Hoàn thành"}
                  </span>
                </div>
                {lastMsg && (
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {lastMsg.content}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  <Clock className="mr-1 inline h-3 w-3" />
                  {formatDate(c.updatedAt)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selected.customer.firstName} {selected.customer.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selected.customer.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!selected.staffId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => assignM.mutate(selected.id)}
                        loading={assignM.isPending}
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Nhận
                      </Button>
                    )}
                    {selected.status === "open" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resolveM.mutate(selected.id)}
                        loading={resolveM.isPending}
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Hoàn thành
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex h-[calc(100%-8rem)] flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto py-3">
                  {selected.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex max-w-[80%]",
                        msg.senderId === selected.customerId
                          ? "justify-start"
                          : "ml-auto justify-end",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2 text-sm",
                          msg.senderId === selected.customerId
                            ? "bg-slate-100 text-slate-800"
                            : "bg-brand-600 text-white",
                        )}
                      >
                        {msg.content}
                        <p className="mt-0.5 text-[10px] opacity-70">
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập phản hồi…"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && reply.trim()) {
                          sendM.mutate({
                            id: selected.id,
                            content: reply.trim(),
                          });
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() =>
                        sendM.mutate({ id: selected.id, content: reply.trim() })
                      }
                      disabled={!reply.trim() || sendM.isPending}
                      loading={sendM.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex h-[calc(100vh-12rem)] items-center justify-center">
              <CardContent className="text-center text-sm text-slate-400">
                <MessageCircle className="mx-auto mb-2 h-10 w-10" />
                Chọn một cuộc trò chuyện để xem chi tiết
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
