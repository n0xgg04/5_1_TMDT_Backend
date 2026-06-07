"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  CheckCircle,
  Send,
  Receipt,
  AlertCircle,
  ArrowLeft,
  Users,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import {
  mergeConversationList,
  mergeMessageIntoConversation,
} from "@/lib/chat-cache";
import { Button } from "@/components/ui/button";
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
  bookingId: string | null;
  status: string;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { firstName: string; lastName: string; email: string };
  messages: Message[];
  booking?: {
    id: string;
    bookingCode: string;
    room?: { roomNumber: string; roomType?: { name: string } };
    checkIn: string;
    checkOut: string;
  } | null;
}

export default function AdminConversationsPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [chatStreamConnected, setChatStreamConnected] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const listQ = useQuery({
    queryKey: ["admin-conversations", statusFilter],
    refetchInterval: chatStreamConnected ? false : 5000,
    queryFn: () =>
      api
        .get<Conversation[]>("/chat/staff/conversations", {
          params: statusFilter ? { status: statusFilter } : {},
        })
        .then((r) => r.data),
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [detailQ.data?.messages]);

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
  const openCount = conversations.filter((c) => c.status === "open").length;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hộp thư hỗ trợ</h1>
          <p className="text-sm text-slate-500">
            {openCount} cuộc trò chuyện đang mở · {conversations.length} tổng cộng
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { value: "open", label: "Đang mở" },
            { value: "", label: "Tất cả" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === tab.value
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full overflow-y-auto border-r border-slate-200 bg-white lg:w-96">
          {conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Chưa có cuộc trò chuyện</p>
              <p className="mt-1 text-xs text-slate-400">
                {statusFilter === "open"
                  ? "Tất cả cuộc trò chuyện đã được giải quyết."
                  : "Khi khách hàng gửi yêu cầu hỗ trợ, họ sẽ xuất hiện ở đây."}
              </p>
            </div>
          ) : (
            conversations.map((c) => {
              const lastMsg = c.messages?.[0];
              const isBookingChat = Boolean(c.bookingId && c.booking);
              const avatar = `${(c.customer.firstName?.[0] ?? "").toUpperCase()}${(c.customer.lastName?.[0] ?? "").toUpperCase()}`;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "flex w-full gap-3 border-b border-slate-100 px-5 py-3.5 text-left transition-colors",
                    selectedId === c.id
                      ? "bg-brand-50 border-l-[3px] border-l-brand-600"
                      : "border-l-[3px] border-l-transparent hover:bg-slate-50",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    {avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {c.customer.firstName} {c.customer.lastName}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(c.updatedAt)}
                      </span>
                    </div>
                    {isBookingChat ? (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-brand-700">
                        <Receipt className="h-3 w-3 shrink-0" />
                        {c.booking?.bookingCode ?? ""}
                        {c.booking?.room ? ` · ${c.booking.room.roomType?.name ?? "Phòng"} ${c.booking.room.roomNumber}` : ""}
                      </p>
                    ) : (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Hỗ trợ chung
                      </p>
                    )}
                    {lastMsg && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {lastMsg.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="hidden flex-1 flex-col overflow-hidden lg:flex">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {(selected.customer.firstName?.[0] ?? "").toUpperCase()}{(selected.customer.lastName?.[0] ?? "").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {selected.customer.firstName} {selected.customer.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {selected.customer.email}
                      {selected.booking ? ` · ${selected.booking.bookingCode}` : " · Hỗ trợ chung"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!selected.staffId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => assignM.mutate(selected.id)}
                      loading={assignM.isPending}
                    >
                      Nhận
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

              <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-4 space-y-3">
                {selected.booking && (
                  <div className="mx-auto mb-4 max-w-md rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-xs text-slate-600">
                    <span className="font-medium">
                      {selected.booking.room?.roomType?.name ?? "Phòng"} · #{selected.booking.room?.roomNumber ?? "-"}
                    </span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span>{selected.booking.checkIn?.slice(0, 10)} → {selected.booking.checkOut?.slice(0, 10)}</span>
                  </div>
                )}
                {selected.messages?.length === 0 && (
                  <div className="py-10 text-center text-sm text-slate-400">
                    Chưa có tin nhắn. Gửi phản hồi đầu tiên cho khách.
                  </div>
                )}
                {selected.messages?.map((msg) => {
                  const isStaff = msg.senderId !== selected.customerId;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex max-w-[75%]",
                        isStaff ? "ml-auto justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                          isStaff
                            ? "rounded-br-md bg-brand-600 text-white"
                            : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200",
                        )}
                      >
                        <p>{msg.content}</p>
                        <p className="mt-1 text-[10px] opacity-70 text-right">
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-3">
                <div className="flex gap-2">
                  <input
                    placeholder="Nhập phản hồi…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && reply.trim()) {
                        e.preventDefault();
                        sendM.mutate({ id: selected.id, content: reply.trim() });
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white"
                  />
                  <Button
                    size="sm"
                    onClick={() => sendM.mutate({ id: selected.id, content: reply.trim() })}
                    disabled={!reply.trim() || sendM.isPending}
                    loading={sendM.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <MessageCircle className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-700">Chọn một cuộc trò chuyện</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Chọn một cuộc trò chuyện từ danh sách bên trái để xem chi tiết và phản hồi cho khách hàng.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                <Users className="h-4 w-4 text-slate-300" />
                <span>Các cuộc trò chuyện có gắn đơn phòng sẽ hiển thị kèm thông tin booking</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
