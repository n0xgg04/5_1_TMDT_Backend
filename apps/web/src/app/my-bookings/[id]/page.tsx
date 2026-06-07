"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  Tag,
  MapPin,
  BedDouble,
  CreditCard,
  XCircle,
  Star,
  MessageSquare,
  Send,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import {
  BookingStatusBadge,
  bookingStatusAction,
} from "@/components/ui/badge";
import { BookingStatePanel, hotelFallbackImage } from "@/components/hotel/commercial";
import { toast } from "@/lib/toast";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  diffNights,
} from "@/lib/utils";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import { mergeMessageIntoConversation } from "@/lib/chat-cache";
import type {
  Booking,
  BookingStatus,
  ChatMessageCreatedEvent,
  Conversation,
} from "@/lib/types";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  const [chatStreamConnected, setChatStreamConnected] = useState(false);

  const q = useQuery({
    queryKey: ["booking", id],
    enabled: !!id,
    queryFn: () => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  });

  const cancelM = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã hủy đơn");
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const payM = useMutation({
    mutationFn: () =>
      api
        .post(`/payments/initiate`, {
          bookingId: id,
          method: "VNPAY",
          couponCode: couponCode.trim() || undefined,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const chatQ = useQuery({
    queryKey: ["booking-chat", id],
    enabled: q.data?.status === "PENDING_HOST_APPROVAL",
    refetchInterval: chatStreamConnected ? false : 5000,
    queryFn: () =>
      api
        .get<Conversation>(`/chat/conversation/booking/${id}`)
        .then((r) => r.data),
  });

  const handleChatMessage = useCallback(
    (event: ChatMessageCreatedEvent) => {
      if (event.bookingId !== id) return;
      qc.setQueryData<Conversation>(["booking-chat", id], (current) =>
        mergeMessageIntoConversation(current, event) as Conversation,
      );
    },
    [id, qc],
  );

  useChatRealtime({
    enabled:
      q.data?.status === "PENDING_HOST_APPROVAL" && Boolean(chatQ.data?.id),
    onMessage: handleChatMessage,
    onReconnect: () => {
      qc.invalidateQueries({ queryKey: ["booking-chat", id] });
    },
    onConnectionChange: setChatStreamConnected,
  });

  const sendMessageM = useMutation({
    mutationFn: (content: string) =>
      api
        .post(`/chat/conversation/${chatQ.data?.id}/messages`, { content })
        .then((r) => r.data),
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["booking-chat", id] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (q.isLoading) return <DetailSkeleton />;
  if (q.error || !q.data)
    return (
      <main className="container-page py-10">
        <EmptyState
          title="Không tìm thấy đơn"
          description={
            q.error ? getApiErrorMessage(q.error) : "Đơn không tồn tại."
          }
        />
      </main>
    );

  const b = q.data;
  const nights = diffNights(b.checkIn, b.checkOut);
  const canCancel: BookingStatus[] = [
    "PENDING_HOST_APPROVAL",
    "PENDING_PAYMENT",
    "CONFIRMED",
  ];
  const canPay = b.status === "PENDING_PAYMENT";
  const canReview = b.status === "CHECKED_OUT" && !b.review;
  const fallbackImg = hotelFallbackImage(b.room?.roomType?.name ?? "");
  const roomImg = b.room?.roomType?.images?.[0] ?? fallbackImg;

  return (
    <main className="customer-page">
      <div className="container-page py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg shadow-card">
            <img
              src={roomImg}
              alt={b.room?.roomType?.name ?? "Phòng"}
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-ink-950">
                {b.room?.roomType?.name ?? "Phòng"} · #{b.room?.roomNumber}
              </h1>
              <BookingStatusBadge status={b.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <Tag className="mr-1 inline h-3.5 w-3.5" />
              {b.bookingCode}
            </p>
          </div>

          <BookingStatePanel
            status={b.status}
            deadline={
              b.status === "PENDING_HOST_APPROVAL" && b.approvalDeadline
                ? formatDateTime(b.approvalDeadline)
                : b.status === "PENDING_PAYMENT" && b.paymentDeadline
                  ? formatDateTime(b.paymentDeadline)
                  : undefined
            }
            title={bookingStatusAction(b.status)}
            description={
              b.status === "PENDING_PAYMENT"
                ? "Đơn đã được duyệt. Bạn có thể nhập mã giảm giá và thanh toán để xác nhận giữ chỗ."
                : b.status === "PENDING_HOST_APPROVAL"
                  ? "Trong thời gian chờ duyệt, bạn có thể trao đổi với admin ngay trên đơn này."
                  : undefined
            }
          />

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Thông tin lưu trú
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Số đêm"
                  value={`${nights} đêm`}
                />
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label="Khách"
                  value={`${b.adults ?? 1} người lớn${b.children ? `, ${b.children} trẻ em` : ""}`}
                />
                <InfoRow
                  icon={<BedDouble className="h-4 w-4" />}
                  label="Loại giường"
                  value={b.room?.roomType?.bedType ?? "-"}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Chi nhánh"
                  value={b.room?.branch?.name ?? "-"}
                />
              </div>
              {b.specialRequests && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-medium">Yêu cầu đặc biệt:</span>{" "}
                  {b.specialRequests}
                </div>
              )}
              {b.rejectedReason && (
                <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                  <span className="font-medium">Lý do từ chối:</span>{" "}
                  {b.rejectedReason}
                </div>
              )}
              {b.status === "PENDING_HOST_APPROVAL" &&
                b.approvalDeadline && (
                  <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-700">
                    <span className="font-medium">Hạn duyệt:</span>{" "}
                    {formatDateTime(b.approvalDeadline)}
                  </div>
                )}
              {b.status === "PENDING_PAYMENT" && b.paymentDeadline && (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  <span className="font-medium">Hạn thanh toán:</span>{" "}
                  {formatDateTime(b.paymentDeadline)}
                </div>
              )}
            </CardContent>
          </Card>

          {b.status === "PENDING_HOST_APPROVAL" && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-brand-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Trao đổi với admin
                  </h2>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
                  {chatQ.isLoading ? (
                    <p className="text-sm text-slate-500">Đang tải chat...</p>
                  ) : !chatQ.data?.messages?.length ? (
                    <p className="text-sm text-slate-500">
                      Chưa có tin nhắn nào cho yêu cầu này.
                    </p>
                  ) : (
                    chatQ.data.messages.map((m) => {
                      const mine = m.senderId === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                              mine
                                ? "bg-brand-600 text-white"
                                : "bg-white text-slate-700 ring-1 ring-slate-200"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
                  />
                  <Button
                    onClick={() => {
                      const content = message.trim();
                      if (content) sendMessageM.mutate(content);
                    }}
                    disabled={!chatQ.data?.id || chatQ.isLoading}
                    loading={sendMessageM.isPending}
                  >
                    <Send className="h-4 w-4" /> Gửi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-24 overflow-hidden">
            <div className="bg-ink-950 p-5 text-white">
              <p className="text-sm text-white/70">Chi tiết giá</p>
              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(b.totalAmount)}
              </p>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tổng tiền</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(b.totalAmount)}
                  </span>
                </div>
                {b.payment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Đã thanh toán</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(b.payment.amount)} (
                      {b.payment.paymentType})
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">
                    Trạng thái
                  </span>
                  <BookingStatusBadge status={b.status} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {canPay && (
                  <div className="space-y-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Mã giảm giá"
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
                    />
                    <Button
                      className="w-full"
                      variant="accent"
                      onClick={() => payM.mutate()}
                      loading={payM.isPending}
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Thanh toán ngay
                    </Button>
                  </div>
                )}
                {canCancel.includes(b.status) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => cancelM.mutate()}
                    loading={cancelM.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Hủy đơn
                  </Button>
                )}
                {canReview && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/my-bookings/${id}/review`)}
                  >
                    <Star className="mr-2 h-4 w-4" /> Viết đánh giá
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </main>
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
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="container-page py-8">
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </main>
  );
}
