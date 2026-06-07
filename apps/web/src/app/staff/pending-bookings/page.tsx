"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Calendar,
  User as UserIcon,
  BedDouble,
  Clock,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import { mergeBookingConversationSummary } from "@/lib/chat-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge, RoomStatusBadge } from "@/components/ui/badge";
import { OperationHeader } from "@/components/hotel/commercial";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Booking, ChatMessageCreatedEvent } from "@/lib/types";

export default function StaffPendingBookingsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<
    Record<string, boolean>
  >({});
  const [chatStreamConnected, setChatStreamConnected] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-pending-bookings"],
    refetchInterval: chatStreamConnected ? false : 5000,
    queryFn: () =>
      api
        .get<{ items: Booking[]; total: number }>(
          "/bookings/staff/approval-requests",
        )
        .then((r) => r.data),
  });

  const handleChatMessage = useCallback(
    (event: ChatMessageCreatedEvent) => {
      if (event.bookingStatus !== "PENDING_HOST_APPROVAL") return;
      qc.setQueryData<{ items: Booking[]; total: number }>(
        ["staff-pending-bookings"],
        (current) => mergeBookingConversationSummary(current, event),
      );
    },
    [qc],
  );

  useChatRealtime({
    enabled: true,
    onMessage: handleChatMessage,
    onReconnect: () => {
      qc.invalidateQueries({ queryKey: ["staff-pending-bookings"] });
    },
    onConnectionChange: setChatStreamConnected,
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/approve-request`, {}),
    onSuccess: () => {
      toast.success("Đã duyệt booking");
      qc.invalidateQueries({ queryKey: ["staff-pending-bookings"] });
    },
    onError: (e) => toast.error("Duyệt thất bại", getApiErrorMessage(e)),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/bookings/${id}/reject-request`, { reason }),
    onSuccess: () => {
      toast.success("Đã từ chối booking");
      qc.invalidateQueries({ queryKey: ["staff-pending-bookings"] });
    },
    onError: (e) => toast.error("Từ chối thất bại", getApiErrorMessage(e)),
  });

  const openChat = useMutation({
    mutationFn: (id: string) =>
      api.post(`/chat/staff/bookings/${id}/conversation`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã mở hội thoại");
      router.push("/staff/conversations");
    },
    onError: (e) => toast.error("Không mở được chat", getApiErrorMessage(e)),
  });

  return (
    <div>
      <OperationHeader
        kicker="Approval queue"
        title="Duyệt đặt phòng"
        description="Xem xét yêu cầu đặt chỗ, kiểm tra trạng thái phòng, trao đổi với khách và chỉ mở thanh toán sau khi duyệt."
      />

      {isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              Không có yêu cầu nào chờ duyệt
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {data.items.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-white pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      #{b.bookingCode}
                    </span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <div className="flex gap-2">
                    {!showRejectInput[b.id] && (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => approve.mutate(b.id)}
                        loading={
                          approve.isPending && approve.variables === b.id
                        }
                      >
                        <CheckCircle className="h-4 w-4" /> Duyệt yêu cầu
                      </Button>
                    )}
                    {!showRejectInput[b.id] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openChat.mutate(b.id)}
                        loading={
                          openChat.isPending && openChat.variables === b.id
                        }
                      >
                        <MessageSquare className="h-4 w-4" /> Chat
                      </Button>
                    )}
                    {!showRejectInput[b.id] ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          setShowRejectInput((p) => ({ ...p, [b.id]: true }))
                        }
                      >
                        <XCircle className="h-4 w-4" /> Từ chối
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          const reason = rejectReason[b.id]?.trim();
                          if (!reason) {
                            toast.warning("Vui lòng nhập lý do từ chối");
                            return;
                          }
                          reject.mutate({ id: b.id, reason });
                        }}
                        loading={
                          reject.isPending && reject.variables?.id === b.id
                        }
                      >
                        <XCircle className="h-4 w-4" /> Xác nhận từ chối
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <InfoRow
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Khách"
                    value={`${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`}
                  />
                  <InfoRow
                    icon={<BedDouble className="h-4 w-4" />}
                    label="Phòng"
                    value={`#${b.room?.roomNumber ?? ""} - ${b.room?.roomType?.name ?? ""}`}
                  />
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Nhận phòng"
                    value={`${formatDate(b.checkIn)} ${b.checkInTime ? `(${b.checkInTime})` : ""}`}
                  />
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Trả phòng"
                    value={`${formatDate(b.checkOut)} ${b.checkOutTime ? `(${b.checkOutTime})` : ""}`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InfoRow
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Người lớn"
                    value={`${b.adults ?? 2}`}
                  />
                  <InfoRow
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Trẻ em"
                    value={`${b.children ?? 0}`}
                  />
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Hạn duyệt"
                    value={
                      b.approvalDeadline
                        ? new Date(b.approvalDeadline).toLocaleString("vi-VN")
                        : "-"
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <span className="text-slate-500">Trạng thái phòng:</span>
                  {b.room?.status && <RoomStatusBadge status={b.room.status} />}
                  {b.hasActiveOverlap && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                      <AlertTriangle className="h-3.5 w-3.5" /> Có đơn trùng lịch
                    </span>
                  )}
                  {b.conversation && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                      <MessageSquare className="h-3.5 w-3.5" /> Đã có hội thoại
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-xs text-slate-500">Tổng tiền</p>
                    <p className="text-xl font-bold text-brand-800">
                      {formatCurrency(b.totalAmount)}
                    </p>
                    {b.payment && b.payment.amount !== b.totalAmount && (
                      <p className="text-xs text-slate-500">
                        Đã thanh toán: {formatCurrency(b.payment.amount)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Trạng thái thanh toán
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {b.payment?.status ?? "Chưa thanh toán"}
                    </p>
                  </div>
                </div>

                {b.specialRequests && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="flex items-center gap-1 font-medium text-amber-800">
                      <MessageSquare className="h-3.5 w-3.5" /> Yêu cầu đặc biệt
                    </p>
                    <p className="mt-1 text-amber-700">{b.specialRequests}</p>
                  </div>
                )}

                {b.guestNotes && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-700">Ghi chú:</p>
                    <p className="mt-1 text-slate-600">{b.guestNotes}</p>
                  </div>
                )}

                {showRejectInput[b.id] && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Nhập lý do từ chối..."
                      value={rejectReason[b.id] ?? ""}
                      onChange={(e) =>
                        setRejectReason((p) => ({
                          ...p,
                          [b.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowRejectInput((p) => ({ ...p, [b.id]: false }));
                        setRejectReason((p) => ({ ...p, [b.id]: "" }));
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
